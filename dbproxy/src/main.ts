import net from "net";
import mysql from "mysql2";
import Connection from "mysql2/typings/mysql/lib/Connection";
import util from "util";

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

const getClientConnection = async (): Promise<Connection> => {
  var clientConn = mysql.createConnection({
    host: "127.0.0.1",
    user: "root",
    password: "root",
    database: "test",
    port: 3306,
  });

  const connect = util.promisify(clientConn.connect.bind(clientConn));
  await connect();
  return clientConn;
};

const listen = async (port: number) => {
  const server = (mysql as any).createServer();
  server.on("connection", async (conn: Connection) => {
    //const proxyConn = await getClientConnection();

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
    conn.on("query", (query: any) => {
      console.log("got query", query);
      // proxyConn.query(query, (err, results, fields) => {
      //   console.log("result", err, results, fields);
      // });
    });
    conn.on("error", (error: any) => {});
  });

  return new Promise((resolve, reject) => {
    server.listen(port, (err: any) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(server);
    });
  });
};

listen(port).then((server) => {
  var connection = mysql.createConnection({
    host: "127.0.0.1",
    user: "root",
    password: "root",
    database: "test",
    port,
  });

  connection.connect((err) => {
    if (err) throw err;
  });

  connection.query("select 1+1", function (error, results, fields) {
    if (error) throw error;
    console.log("The solution is: ", results);
  });
  // connection.query("begin", function (error, results, fields) {
  //   if (error) throw error;
  //   console.log("The solution is: ", results);
  // });

  // connection.query("begin", function (error, results, fields) {
  //   if (error) throw error;
  //   console.log("The solution is: ", results);
  // });
  connection.end();
});
