import mysqlServer from "mysql2";
import mysql from "mysql2/promise";
import Connection, {
  ConnectionOptions,
} from "mysql2/typings/mysql/lib/Connection";
import X from "node-sql-parser/build/mysql";
import util from "util";

const Parser = (X as any).Parser;

const COMPRESS = 0x00000020; // from  require("mysql2/lib/constants/client");
const parser = new Parser();

export class MySqlProxy {
  remoteConnectionOptions: ConnectionOptions;
  proxyConn: mysql.Connection | undefined;
  server: any;
  constructor(remoteConnectionOptions: ConnectionOptions) {
    this.remoteConnectionOptions = remoteConnectionOptions;
    // note: createServer isn't exported by default
    this.server = (mysqlServer as any).createServer();
    this.server.on("connection", this.handleIncomingConnection.bind(this));
  }

  async handleIncomingConnection(conn: Connection) {
    console.log("got incoming connection");

    if (!this.proxyConn) {
      try {
        this.proxyConn = await mysql.createConnection(
          this.remoteConnectionOptions
        );
        this.proxyConn.on("end", () => {
          console.log("Remote DB connection closed");
          this.proxyConn = undefined;
        });
      } catch (err) {
        console.error("Can't connect to remote DB server", err);
        conn.destroy();
        return;
      }
    }
    conn.on("query", this.processQuery.bind(this, conn));
    conn.on("error", (err: any) => {
      console.error("Connection error", err);
      // TODO close?
    });
    conn.on("end", () => {
      console.log("connection closed");
    });
    sendHandshake(conn);
  }

  async close() {
    const promises: Promise<void>[] = [];
    if (this.server) {
      promises.push(util.promisify(this.server.close.bind(this.server))());
    }
    if (this.proxyConn) {
      promises.push(this.proxyConn.end());
    }
    await Promise.all(promises);
    this.server = null;
    this.proxyConn = undefined;
  }

  async listen(port: number) {
    return util.promisify(this.server.listen.bind(this.server, port))();
  }

  async processQuery(conn: Connection, query: string) {
    console.log("got query", query);
    if (!this.proxyConn) {
      console.error(
        "Can't proxy the query because the remote DB connection is closed."
      );
      return;
    }

    // TODO blacklist all these queries https://dev.mysql.com/doc/refman/8.0/en/implicit-commit.html
    try {
      const [results, fields] = await this.proxyConn.query(query);
      if (Array.isArray(results)) {
        (conn as any).writeTextResult(results, fields);
      } else {
        (conn as any).writeOk(results);
      }
    } catch (err) {
      // TODO make sure the error fields are properly encoded
      // in the response
      console.error("Remote DB returned an error", err);
      (conn as any).writeError({
        message: err.message,
        code: err.code,
        sqlState: err.sqlState,
        errno: err.errno,
      });
    }
  }
}

const sendHandshake = (conn: Connection) => {
  let flags = 0xffffff;
  //    flags = flags ^ COMPRESS;
  (conn as any).serverHandshake({
    protocolVersion: 10,
    serverVersion: "devinprod proxy 1.0",
    connectionId: 1234,
    statusFlags: 2,
    characterSet: 8,
    capabilityFlags: flags,
  });
};
