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
  //clientConns: Connection[] = [];

  connCounter = 0;
  constructor(remoteConnectionOptions: ConnectionOptions) {
    this.remoteConnectionOptions = remoteConnectionOptions;
    // note: createServer isn't exported by default
    this.server = (mysqlServer as any).createServer();
    this.server.on("connection", this.handleIncomingConnection.bind(this));
  }

  async handleIncomingConnection(conn: Connection) {
    console.log("got incoming connection");
    //(conn as any).id = this.connCounter++;

    if (!this.proxyConn) {
      try {
        this.proxyConn = await mysql.createConnection(
          this.remoteConnectionOptions
        );
        this.proxyConn.on("end", () => {
          console.log("Remote DB connection closed.");
          // TODO retry connecting?
          //this.clientConns.forEach((clientConn) => clientConn.destroy());
          this.proxyConn = undefined;
        });
      } catch (err) {
        console.error("Can't connect to remote DB server", err);
        conn.destroy();
        return;
      }
    }
    //this.clientConns.push(conn);
    conn.on("query", this.processQuery.bind(this, conn));
    conn.on("error", (err: any) => {
      console.error("Connection error", err);
      //this.removeConn(conn);
      // TODO close?
    });
    conn.on("end", () => {
      console.log("Client connection closed. Closing proxy connection.");
      //this.removeConn(conn);
      this.proxyConn?.destroy();
    });
    sendHandshake(conn);
  }

  // removeConn(conn: Connection) {
  //   delete this.clientConns[(conn as any).id];
  // }

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
    console.log("got query:", query);
    if (!this.checkQuery(query)) {
      (conn as any).writeError({
        message: "Invalid query: " + query,
      });
      return;
    }

    if (!this.proxyConn) {
      console.error(
        "Can't proxy the query because the remote DB connection is closed."
      );
      // TODO retry connecting?
      (conn as any).writeError({
        message:
          "Can't proxy the query because the remote DB connection is closed.",
      });
      return;
    }

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

  checkQuery(query: string) {
    const queryRe = /^(SELECT|INSERT|UPDATE|DELETE|BEGIN|START TRANSACTION|COMMIT|ROLLBACK)/i;
    return queryRe.test(query);
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
