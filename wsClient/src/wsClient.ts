import { clientSchema, serverSchema } from "lib/src/wsSchema";
import fetch from "node-fetch";
import WebSocket from "ws";
import { log } from "../../lib/src/log";
import { initWebsocket, WsWrapper } from "../../lib/src/typedWs";

export class WsClient {
  wsWrapper: WsWrapper<typeof serverSchema, typeof clientSchema> | null;
  routerWsUrl: string;
  localServiceUrl: string;
  authToken: string;

  constructor(routerWsUrl: string, localServiceUrl: string, authToken: string) {
    this.routerWsUrl = routerWsUrl;
    this.localServiceUrl = localServiceUrl;
    this.authToken = authToken;

    this.wsWrapper = null;
  }

  async connectWs() {
    this.wsWrapper = initWsClient(this.routerWsUrl, this.localServiceUrl);
    this.wsWrapper!.ws.on("open", () => {
      if (!this.wsWrapper) {
        console.error("Lost websocket");
        return;
      }
      this.wsWrapper.sendMsg("connect", {
        authToken: this.authToken,
      });
    });
    this.wsWrapper!.ws.on("close", () => {
      this.wsWrapper = null;
    });
  }

  async close() {
    this.wsWrapper?.ws.close();
  }
}

export const initWsClient = (
  routerWsUrl: string,
  localServiceUrl: string
): WsWrapper<typeof serverSchema, typeof clientSchema> => {
  const ws = new WebSocket(routerWsUrl);
  initWebsocket(ws);
  const wrapper = new WsWrapper(ws, serverSchema, clientSchema);
  wrapper.setHandler(
    "proxy",
    async ({ path, requestId, method, headers, body: reqBody }) => {
      try {
        log("fetching", localServiceUrl + path);
        const res = await fetch(localServiceUrl + path, {
          headers,
          method,
          body: reqBody ? reqBody : undefined,
        });
        const resBody = await res.text();
        const headersMap: Record<string, string> = {};
        res.headers.forEach((val, key) => {
          headersMap[key] = val;
        });
        wrapper.sendMsg("proxyResult", {
          requestId: requestId,
          status: res.status,
          headers: headersMap,
          body: resBody,
        });
      } catch (err) {
        console.error("fetch error", err);
        wrapper.sendMsg("proxyError", {
          requestId,
          message: "failed to proxy request",
        });
      }
    }
  );
  wrapper.setHandler("connectionError", async () => {
    log("can't connect"); // TODO show better error
  });
  return wrapper;
};
