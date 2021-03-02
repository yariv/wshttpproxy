import { genNewToken } from "dev-in-prod-lib/src/utils";
import mysqlServer from "mysql2";
import mysql, { Connection } from "mysql2/promise";
import { ConnectionOptions } from "mysql2/typings/mysql/lib/Connection";
import util from "util";

export type OnConn = (conn: mysqlServer.Connection) => Promise<string>;
export type OnProxyConn = (conn: Connection) => Promise<void>;
export type OnQuery = (
  conn: mysqlServer.Connection,
  query: string
) => Promise<string[]>;

export class MySqlProxy {
  port: number;
  remoteConnectionOptions: ConnectionOptions;
  connections: Record<
    string,
    {
      proxyConn: Connection;
      clientConns: Record<string, mysqlServer.Connection>;
    }
  > = {};
  server: any;
  onConn: OnConn | undefined;
  onProxyConn: OnProxyConn | undefined;
  onQuery: OnQuery | undefined;

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

  disconnectAll(connGroupKey: string) {
    if (!(connGroupKey in this.connections)) {
      return;
    }
    const connGroup = this.connections[connGroupKey];
    Object.values(connGroup.clientConns).forEach((conn) => tryClose(conn));
    tryClose(connGroup.proxyConn);
    delete this.connections[connGroupKey];
  }

  async handleIncomingConnection(conn: mysqlServer.Connection) {
    // TODO use shorter ids?
    const connId = genNewToken();
    (conn as any).devInProdId = connId;

    let connGroupKey = "default";
    if (this.onConn) {
      connGroupKey = await this.onConn(conn);
    }
    (conn as any).connGroupKey = connGroupKey;

    if (connGroupKey in this.connections) {
      this.connections[connGroupKey].clientConns[connId] = conn;
    } else {
      try {
        const proxyConn = await mysql.createConnection(
          this.remoteConnectionOptions
        );
        // hack to get to the right listener
        (proxyConn as any).connection.stream.on("close", () => {
          this.disconnectAll(connGroupKey);
        });
        if (this.onProxyConn) {
          try {
            await this.onProxyConn(proxyConn);
          } catch (e) {
            tryClose(proxyConn);
            tryClose(conn);
            return;
          }
        }
        this.connections[connGroupKey] = {
          clientConns: { [connId]: conn },
          proxyConn,
        };
      } catch (err) {
        console.error("Can't connect to remote DB server", err);
        tryClose(conn);
        return;
      }
    }

    conn.on("query", this.processQuery.bind(this, conn));
    conn.on("error", (err: any) => {
      console.log("Client connection error", err);
      tryClose(conn);
    });
    (conn as any).stream.on("close", () => {
      if (connGroupKey in this.connections) {
        const connGroup = this.connections[connGroupKey];
        delete connGroup.clientConns[connId];
        if (
          Object.keys(this.connections[connGroupKey].clientConns).length === 0
        ) {
          tryClose(connGroup.proxyConn);
          this.connections[connGroupKey];
        }
      }
    });
    sendHandshake(conn);
  }

  get numProxyConns(): number {
    return Object.keys(this.connections).length;
  }

  getConnId(conn: mysqlServer.Connection): string {
    return (conn as any).devInProdId;
  }

  async close() {
    for (const connGroupKey of Object.keys(this.connections)) {
      this.disconnectAll(connGroupKey);
    }
    if (this.server) {
      await util.promisify(this.server.close.bind(this.server))();
    }
    this.server = null;
  }

  async listen() {
    await util.promisify(this.server.listen.bind(this.server, this.port))();
    console.log("MySQL proxy is listening on ", this.port);
  }

  async processQuery(conn: mysqlServer.Connection, query: string) {
    console.log("Got query:", query);
    const connGroupKey = (conn as any).connGroupKey;
    const connGroup = this.connections[connGroupKey];
    if (!connGroup) {
      console.error("Missing connection group for ", connGroupKey);
      (conn as any).writeError({
        message: "Connection error",
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
    await this.sendQueries(conn, connGroup.proxyConn, queries);
  }

  async sendQueries(
    conn: mysqlServer.Connection,
    proxyConn: Connection,
    queries: string[]
  ) {
    // Note: we only return the result of the last query
    const lastQuery = queries.pop();
    if (!lastQuery) {
      (conn as any).writeOk("Ok");
      return;
    }
    try {
      for (const query of queries) {
        await proxyConn.query(query);
      }
      const [results, fields] = await proxyConn.query(lastQuery);
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
