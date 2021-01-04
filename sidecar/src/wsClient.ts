import { request } from "http";
import { loadGetInitialProps } from "next/dist/next-server/lib/utils";
import WebSocket, { CloseEvent, ErrorEvent, MessageEvent, OpenEvent } from "ws";
import { log } from "../shared/src/log";
import { settings } from "./settings";

enum MsgType {
  hello = "hello",
  authorized = "authorized",
  invalidToken = "invalidToken",
  error = "error",
  proxyRequest = "proxyRequest",
  proxyResponse = "proxyResponse",
}

enum WsClientState {
  connecting,
  authorizing,
  listening,
  closed,
  error,
}
class WsClient {
  ws: WebSocket;
  state: WsClientState;

  constructor(wsUrl: string, token: string) {
    this.state = WsClientState.connecting;

    this.ws = new WebSocket(wsUrl);
    this.ws.onopen = (event: OpenEvent) => {
      this.state = WsClientState.authorizing;
      this.send(MsgType.hello, token);
    };
    this.ws.onmessage = (event: MessageEvent) => {
      (async () => {
        const msg = parse(event);
        log("message", msg);
        const msgType = msg.type;
        const msgBody = msg.body;

        switch (this.state) {
          case WsClientState.authorizing:
            if (msgType == MsgType.authorized) {
              this.state = WsClientState.listening;
            } else if (msgType == MsgType.error) {
              requireLogin();
            }
            break;
          case WsClientState.listening:
            if (msgType == MsgType.proxyRequest) {
              const resp = await fetch(settings.localServiceUrl, msgBody);
              this.send(MsgType.proxyResponse, resp);
            }
          default:
            log("Unexpected message", msg);
        }
      })();
    };
    this.ws.onerror = (event: ErrorEvent) => {
      console.log("error", event);
      this.state = WsClientState.error;
    };
    this.ws.onclose = (event: CloseEvent) => {
      console.log("close", event);
      this.state = WsClientState.closed;
    };
  }
  send(type: MsgType, body: any) {
    send(this.ws, type, body);
  }
}

const requireLogin = () => {};

type WsMessage = {
  type: MsgType;
  body: any;
};

const send = (ws: WebSocket, type: MsgType, msg: any) => {
  ws.send(JSON.stringify({ type: type, msg }));
};
const parse = (event: MessageEvent): WsMessage => {
  const parsed = JSON.parse(event.data.toString());
  // TODO type check
  return parsed;
};

enum WsServerState {
  listening,
  authorized,
}

class WsServer {
  ws: WebSocket;
  state: WsServerState;

  constructor(ws: WebSocket) {
    this.ws = ws;
    this.state = WsServerState.listening;
    this.ws.onmessage = (event: MessageEvent) => {
      log("message", event);
      const msg = parse(event);
      switch (this.state) {
        case WsServerState.listening:
          if (msg.type == MsgType.hello) {
            // TODO static typing
            const token = msg.body.token;
            (async () => {
              const res = await checkToken();
              if (res) {
                this.send(MsgType.authorized)
              } else {
                this.send(MsgType.invalidToken)
              }

            })
          }
          break;
      }
    });
    this.ws.onerror = (event: ErrorEvent) => {
      console.log("error", event);
    };
    this.ws.onclose = (event: CloseEvent) => {
      console.log("close", event);
    };
  }
  
  send(type: MsgType, body?: any) {
    send(this.ws, type, body);
  }
}

const checkToken = async (token:string)=> {
}

let wsClient;

export const initWsClient = (token: string) => {
  wsClient = new WsClient(settings.wsUrl, token);
};
