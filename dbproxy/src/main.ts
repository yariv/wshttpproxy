import net from "net";
import mysql from "mysql2";

var server = net.createServer((socket) => {
  let conn = net.connect({ host: "127.0.0.1", port: 3306 });
  conn.on("connect", () => {
    console.log("connected to server");
  });
  conn.on("data", (data) => {
    console.log("data from server", data);
    socket.write(data);
  });

  socket.on("close", (hadError) =>
    console.log("client disconnected", hadError)
  );
  socket.on("connect", () => console.log("client connected"));
  socket.on("data", (data) => {
    console.log("data from client", data);
    conn.write(data);
  });
});
server.listen(1235);

var connection = mysql.createConnection({
  host: "127.0.0.1",
  user: "root",
  password: "root",
  database: "test",
  port: 1235,
});

connection.connect();

connection.query("begin", function (error, results, fields) {
  if (error) throw error;
  console.log("The solution is: ", results);
});
connection.query("select 1+1", function (error, results, fields) {
  if (error) throw error;
  console.log("The solution is: ", results);
});

connection.query("begin", function (error, results, fields) {
  if (error) throw error;
  console.log("The solution is: ", results);
});
connection.end();

console.log("SDFSDF");
console.log(Buffer.from("COMMIT"));
