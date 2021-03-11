import { log } from "../../lib/src/log";
import { initWebsocket, WsWrapper } from "../../lib/src/typedWs";
import { clientSchema, serverSchema } from "../../lib/src/wsSchema";
import WebSocket from "ws";

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
          body: reqBody ? reqBody : null,
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
