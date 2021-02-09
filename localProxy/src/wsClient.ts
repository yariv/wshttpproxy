import { log } from "dev-in-prod-lib/dist/log";
import { initWebsocket, WsWrapper } from "dev-in-prod-lib/dist/typedWs";
import { clientSchema, serverSchema } from "dev-in-prod-lib/dist/wsSchema";
import WebSocket from "ws";
import { globalConfig } from "dev-in-prod-lib/dist/utils";

export const initWsClient = (): WsWrapper<
  typeof serverSchema,
  typeof clientSchema
> => {
  const ws = new WebSocket(globalConfig.routerWsUrl);
  initWebsocket(ws);
  const wrapper = new WsWrapper(ws, serverSchema, clientSchema);
  wrapper.setHandler(
    "proxy",
    async ({ path, requestId, method, headers, body: bodyStr }) => {
      try {
        log("fetching", globalConfig.exampleDevUrl + path);
        const res = await fetch(globalConfig.exampleDevUrl + path, {
          headers,
          method,
          body: bodyStr,
        });
        const body = await res.text();
        const headersMap: Record<string, string> = {};
        res.headers.forEach((val, key) => {
          headersMap[key] = val;
        });
        wrapper.sendMsg("proxyResult", {
          requestId: requestId,
          status: res.status,
          headers: headersMap,
          body: body,
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
