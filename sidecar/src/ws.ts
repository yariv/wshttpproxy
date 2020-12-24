import WebSocket, { CloseEvent, ErrorEvent, MessageEvent, OpenEvent } from "ws";

enum MsgType {
  hello = "hello",
  bye = "bye",
}

class WsClient {
  ws: WebSocket;

  constructor(wsUrl: string, token: string) {
    this.ws = new WebSocket(wsUrl);
    this.ws.onopen = (event: OpenEvent) => {
      this.send(MsgType.hello, token);
    };
    this.ws.onmessage = (event: MessageEvent) => {
      console.log("message", event);
    };
    this.ws.onerror = (event: ErrorEvent) => {
      console.log("error", event);
    };
    this.ws.onclose = (event: CloseEvent) => {
      console.log("close", event);
    };
  }

  send(msgType: MsgType, msg: any) {
    this.ws.send(JSON.stringify({ msgType, msg }));
  }
}
export const initWebSocket = (token: string) => {
  const sendMsg = (msg: any) => {
    ws.send(JSON.stringify(msg));
  };
};
