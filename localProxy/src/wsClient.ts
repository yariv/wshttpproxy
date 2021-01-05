import WebSocket, { CloseEvent, ErrorEvent, MessageEvent, OpenEvent } from "ws";
import { globalConfig } from "../../shared/src/globalConfig";
import { log } from "../../shared/src/log";

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
  // TODO add ping/pong
  ws: WebSocket;
  state: WsClientState;

  constructor(wsUrl: string, token: string) {
    this.ws = new WebSocket(wsUrl);
    this.state = WsClientState.connecting;

    this.ws.onopen = (event: OpenEvent) => {
      this.state = WsClientState.authorizing;
      this.send(MsgType.hello, token);
    };
    this.ws.onmessage = (event: MessageEvent) => {
      const res = this.handleMessage(event);
      if (!res) {
        throw new Error(`Invalid message ${event.data}`);
      }
      // TODO await promise somehow
    };
    this.ws.onerror = (event: ErrorEvent) => {
      log("error", event);
      this.state = WsClientState.error;
    };

    this.ws.onclose = (event: CloseEvent) => {
      log("close", event);
      this.state = WsClientState.closed;
    };
  }

  send(type: MsgType, body: any) {
    send(this.ws, type, body);
  }

  handleMessage(event: MessageEvent): boolean {
    const msg = parse(event);
    log("message", msg);
    const msgType = msg.type;
    const msgBody = msg.body;

    switch (this.state) {
      case WsClientState.authorizing:
        if (msgType == MsgType.authorized) {
          this.state = WsClientState.listening;
          return true;
        } else if (msgType == MsgType.error) {
          requireLogin();
          return true;
        }
        break;
      case WsClientState.listening:
        if (msgType == MsgType.proxyRequest) {
          const promise = (async () => {
            const resp = await fetch(globalConfig.exampleUrl, msgBody);
            this.send(MsgType.proxyResponse, resp);
          })();
          // TODO handle promise
          return true;
        }
        break;
    }
    return false;
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
  closed,
}

class WsServer {
  ws: WebSocket;
  state: WsServerState;
  promises: Promise<void>[];

  constructor(ws: WebSocket) {
    this.ws = ws;
    this.state = WsServerState.listening;
    this.promises = [];

    this.ws.onmessage = (event: MessageEvent) => {
      const handled = this.handleMessage(event);
      if (!handled) {
        throw new Error(`Invalid message ${event.data}`);
      }
    };
    this.ws.onerror = (event: ErrorEvent) => {
      log("error", event);
    };
    this.ws.onclose = (event: CloseEvent) => {
      log("close", event);
      this.state = WsServerState.closed;
    };
  }

  handleMessage(event: MessageEvent): boolean {
    log("message", event);
    const msg = parse(event);
    switch (this.state) {
      case WsServerState.listening:
        if (msg.type == MsgType.hello) {
          // TODO static typing
          const token = msg.body.token;
          const promise = (async () => {
            const res = await checkToken(token);
            if (res) {
              this.send(MsgType.authorized);
              this.state = WsServerState.authorized;
            } else {
              this.send(MsgType.invalidToken);
            }
          })();

          // TODO handle promise
          return true;
        }
        break;
    }
    return false;
  }

  send(type: MsgType, body?: any) {
    send(this.ws, type, body);
  }
}

const checkToken = async (token: string): Promise<boolean> => {
  return false;
};

let wsClient;

export const initWsClient = (token: string) => {
  wsClient = new WsClient(globalConfig.wwwWsUrl, token);
};
