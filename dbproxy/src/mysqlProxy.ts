import mysqlServer from "mysql2";
import mysql, { Connection } from "mysql2/promise";
import { ConnectionOptions } from "mysql2/typings/mysql/lib/Connection";
import X from "node-sql-parser/build/mysql";
import util from "util";

const Parser = (X as any).Parser;

const COMPRESS = 0x00000020; // from  require("mysql2/lib/constants/client");
const parser = new Parser();

export class MySqlProxy {
  port: number;
  remoteConnectionOptions: ConnectionOptions;
  proxyConn: Connection | undefined;
  server: any;
  //clientConns: Connection[] = [];

  connCounter = 0;
  constructor(port: number, remoteConnectionOptions: ConnectionOptions) {
    this.port = port;
    this.remoteConnectionOptions = remoteConnectionOptions;
    // note: createServer isn't exported by default
    this.server = (mysqlServer as any).createServer();
    this.server.on("connection", this.handleIncomingConnection.bind(this));
  }

  async handleIncomingConnection(conn: mysqlServer.Connection) {
    console.log("got incoming connection");

    if (!this.proxyConn) {
      try {
        this.proxyConn = await mysql.createConnection(
          this.remoteConnectionOptions
        );
        // hack to get to the right listener
        (this.proxyConn as any).connection.stream.on("close", () => {
          console.log("Remote DB connection closed.");
          tryClose(conn);
          this.proxyConn = undefined;
        });
      } catch (err) {
        console.error("Can't connect to remote DB server", err);
        tryClose(conn);
        return;
      }
    }
    //this.clientConns.push(conn);
    conn.on("query", this.processQuery.bind(this, conn));
    conn.on("error", (err: any) => {
      console.log("Connection error", err);
      tryClose(conn);
      //this.removeConn(conn);
      // TODO close?
    });
    (conn as any).stream.on("close", () => {
      console.log("Client connection closed.");
      //this.removeConn(conn);
      tryClose(this.proxyConn);
      this.proxyConn = undefined;
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
    this.proxyConn?.destroy();
    await Promise.all(promises);
    this.server = null;
    this.proxyConn = undefined;
  }

  async listen() {
    return util.promisify(this.server.listen.bind(this.server, this.port))();
  }

  async processQuery(conn: mysqlServer.Connection, query: string) {
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
  (conn as any).serverHandshake({
    protocolVersion: 10,
    serverVersion: "devinprod proxy 1.0",
    connectionId: 1234,
    statusFlags: 2,
    characterSet: 8,
    capabilityFlags: flags,
  });
};
