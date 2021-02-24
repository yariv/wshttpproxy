import net from "net";
import mysql from "mysql2";
import mysql2 from "mysql2/promise";
import Connection from "mysql2/typings/mysql/lib/Connection";
import util from "util";
import { Parser } from "node-sql-parser";

// var server = net.createServer((socket) => {
//   let conn = net.connect({ host: "127.0.0.1", port: 3306 });
//   conn.on("connect", () => {
//     console.log("connected to server");
//   });
//   conn.on("data", (data) => {
//     console.log("data from server", data);
//     socket.write(data);
//   });

//   socket.on("close", (hadError) =>
//     console.log("client disconnected", hadError)
//   );
//   socket.on("connect", () => console.log("client connected"));
//   socket.on("data", (data) => {
//     console.log("data from client", data);
//     conn.write(data);
//   });
// });
// server.listen(1235);

const COMPRESS = 0x00000020; // from  require("mysql2/lib/constants/client");

const port = 1235;

const parser = new Parser();
const getClientConnection = async (): Promise<mysql2.Connection> => {
  var clientConn = mysql2.createConnection({
    host: "127.0.0.1",
    user: "root",
    password: "root",
    database: "test",
    port: 3306,
  });
  return clientConn;

  // const connect = util.promisify(clientConn.connect.bind(clientConn));
  // await connect();
  // return clientConn;
};

let proxyConn: mysql2.Connection;
const listen = async (port: number): Promise<() => Promise<void>> => {
  const server = (mysql as any).createServer();
  server.on("connection", async (conn: Connection) => {
    proxyConn = await getClientConnection();

    let flags = 0xffffff;
    flags = flags ^ COMPRESS;
    (conn as any).serverHandshake({
      protocolVersion: 10,
      serverVersion: "node.js rocks",
      connectionId: 1234,
      statusFlags: 2,
      characterSet: 8,
      capabilityFlags: flags,
    });

    console.log("connected");
    conn.on("query", async (query: any) => {
      console.log("got query", query);
      //console.log(parser.astify(query));
      const [results, fields] = await proxyConn.query(query);
      console.log("res", results, fields);
      if (Array.isArray(results)) {
        (conn as any).writeTextResult(results, fields);
      } else {
        (conn as any).writeOk(results);
      }
      // TODO try/catch and writeErr?
    });
    conn.on("error", (error: any) => {});
  });

  return new Promise((resolve, reject) => {
    server.listen(port, (err: any) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(async () => {
        server.close();
        proxyConn?.end();
      });
    });
  });
};

listen(port).then(async (close: () => Promise<void>) => {
  var connection = await mysql2.createConnection({
    host: "127.0.0.1",
    user: "root",
    password: "root",
    database: "test",
    port,
  });

  //await connection.connect();

  // connection.query("select * from log", function (error, results, fields) {
  //   if (error) throw error;
  //   console.log("The solution is: ", results, fields);
  //   close();
  // });
  await connection.beginTransaction();

  const [results, fields] = await connection.query("select * from log");
  console.log("The solution is: ", results, fields);
  await connection.commit();

  // connection.query("begin", function (error, results, fields) {
  //   if (error) throw error;
  //   console.log("The solution is: ", results);
  // });

  // connection.query("begin", function (error, results, fields) {
  //   if (error) throw error;
  //   console.log("The solution is: ", results);
  // });
  await connection.end();
  await close();
});
