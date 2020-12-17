import WebSocket from "ws";

const ws = new WebSocket("ws://localhost:3000/ws");

ws.on("open", () => {
  ws.send("hello");
});

ws.on("message", (data) => {
  console.log(data);
});
