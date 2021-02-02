import { log } from "dev-in-prod-lib/src/log";
import { initWebsocket, WsWrapper } from "dev-in-prod-lib/src/typedWs";
import { clientSchema2, serverSchema2 } from "dev-in-prod-lib/src/wsSchema";
import WebSocket from "ws";
import { globalConfig } from "../../lib/src/utils";

export const initWsClient = (): WsWrapper<
  typeof serverSchema2,
  typeof clientSchema2
> => {
  const ws = new WebSocket(globalConfig.routerWsUrl);
  initWebsocket(ws);
  const wrapper = new WsWrapper(ws, serverSchema2);
  wrapper.setHandler(
    "proxy",
    async ({ path, requestId, method, headers, body: bodyStr }) => {
      try {
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
        wrapper.sendMsg<"proxyResult">({
          requestId: requestId,
          status: res.status,
          statusText: res.statusText,
          headers: headersMap,
          body: body,
        });
      } catch (err) {
        console.error("fetch error", err);
        wrapper.sendMsg<"proxyError">({
          requestId,
          message: err.message,
        });
      }
    }
  );
  wrapper.setHandler("connectionError", async () => {
    log("can't connect"); // TODO show better error
  });
  return wrapper;
};
