import mysqlServer from "mysql2";
import mysql, { Connection } from "mysql2/promise";
import { ConnectionOptions } from "mysql2/typings/mysql/lib/Connection";
import util from "util";

export type OnConn = (conn: mysqlServer.Connection) => Promise<void>;
export type OnProxyConn = (conn: Connection) => Promise<void>;
export type OnQuery = (
  conn: mysqlServer.Connection,
  query: string
) => Promise<string[]>;

export class MySqlProxy {
  port: number;
  remoteConnectionOptions: ConnectionOptions;
  proxyConn: Connection | undefined;
  server: any;
  onConn: OnConn | undefined;
  onProxyConn: OnProxyConn | undefined;
  onQuery: OnQuery | undefined;
  conn: mysqlServer.Connection | undefined;

  connCounter = 0;
  constructor(
    port: number,
    remoteConnectionOptions: ConnectionOptions,
    onConn?: OnConn,
    onProxyConn?: OnProxyConn,
    onQuery?: OnQuery
  ) {
    this.port = port;
    this.remoteConnectionOptions = remoteConnectionOptions;
    // note: createServer isn't exported by default
    this.server = (mysqlServer as any).createServer();
    this.server.on("connection", this.handleIncomingConnection.bind(this));
    this.onConn = onConn;
    this.onProxyConn = onProxyConn;
    this.onQuery = onQuery;
  }

  async handleIncomingConnection(conn: mysqlServer.Connection) {
    console.log("got incoming connection");
    this.conn = conn;
    if (this.onConn) {
      await this.onConn(conn);
    }

    if (!this.proxyConn) {
      try {
        this.proxyConn = await mysql.createConnection(
          this.remoteConnectionOptions
        );
        // hack to get to the right listener
        (this.proxyConn as any).connection.stream.on("close", () => {
          tryClose(conn);
          this.proxyConn = undefined;
        });
      } catch (err) {
        console.error("Can't connect to remote DB server", err);
        tryClose(conn);
        return;
      }
      if (this.onProxyConn) {
        try {
          await this.onProxyConn(this.proxyConn);
        } catch (e) {
          console.log("proxy conn error", e);
          tryClose(this.proxyConn);
          this.proxyConn = undefined;
          tryClose(conn);
          return;
        }
      }
    }
    conn.on("query", this.processQuery.bind(this, conn));
    conn.on("error", (err: any) => {
      console.log("Client connection error", err);
      tryClose(conn);
    });
    (conn as any).stream.on("close", () => {
      tryClose(this.proxyConn);
      this.proxyConn = undefined;
    });
    sendHandshake(conn);
  }

  async close() {
    const promises: Promise<void>[] = [];
    if (this.server) {
      promises.push(util.promisify(this.server.close.bind(this.server))());
    }
    this.proxyConn?.destroy();
    await Promise.all(promises);
    this.server = null;
    this.proxyConn = undefined;
  }

  async listen() {
    await util.promisify(this.server.listen.bind(this.server, this.port))();
    console.log("MySQL proxy is listening on ", this.port);
  }

  async processQuery(conn: mysqlServer.Connection, query: string) {
    console.log("Got query:", query);
    if (!this.proxyConn) {
      // TODO retry connecting?
      (conn as any).writeError({
        message:
          "Can't proxy the query because the remote DB connection is closed.",
      });
      return;
    }
    let queries = [query];
    if (this.onQuery) {
      try {
        queries = await this.onQuery(conn, query);
      } catch (e) {
        await (conn as any).writeError({ message: e.message });
        return;
      }
    }
    await this.sendQueries(conn, queries);
  }

  async sendQueries(conn: mysqlServer.Connection, queries: string[]) {
    // Note: we only return the result of the last query
    const lastQuery = queries.pop();
    if (!lastQuery) {
      (conn as any).writeOk("Ok");
      return;
    }
    try {
      for (const query of queries) {
        await this.proxyConn!.query(query);
      }
      const [results, fields] = await this.proxyConn!.query(lastQuery);
      if (Array.isArray(results)) {
        (conn as any).writeTextResult(results, fields);
      } else {
        (conn as any).writeOk(results);
      }
    } catch (err) {
      // TODO make sure the error fields are properly encoded
      // in the response
      (conn as any).writeError({
        message: err.message,
        code: err.code,
        sqlState: err.sqlState,
        errno: err.errno,
      });
    }
  }
}

const crudQueryRe = /^(SELECT|INSERT|UPDATE|DELETE|BEGIN|START TRANSACTION|COMMIT|ROLLBACK)/i;
export const checkCrudQuery: OnQuery = async (
  conn: mysqlServer.Connection,
  query: string
): Promise<string[]> => {
  if (!crudQueryRe.test(query)) {
    throw new Error("Invalid query: " + query);
  }
  return [query];
};

const tryClose = (conn: Connection | mysqlServer.Connection | undefined) => {
  if (conn) {
    try {
      conn.destroy();
    } catch (e) {}
  }
};

const sendHandshake = (conn: mysqlServer.Connection) => {
  let flags = 0xffffff;
  //    flags = flags ^ COMPRESS;

  // TODO re-enable SSL
  //flags = flags ^ 0x00000800;
  (conn as any).serverHandshake({
    protocolVersion: 10,
    serverVersion: "devinprod proxy 1.0",
    connectionId: 1234,
    statusFlags: 2,
    characterSet: 8,
    capabilityFlags: flags,
  });
};
