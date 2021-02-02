import { log } from "dev-in-prod-lib/src/log";
import {
  WsHandlerType,
  initWebsocket,
  WsWrapper,
  getMsgHandler,
} from "dev-in-prod-lib/src/typedWs";
import { clientSchema, serverSchema } from "dev-in-prod-lib/src/wsSchema";
import WebSocket from "ws";
import { globalConfig } from "../../lib/src/utils";

const getHandler = (
  wsWrapper: WsWrapper<typeof clientSchema>
): WsHandlerType<typeof serverSchema> => {
  return async (msg) => {
    log("got message", msg);
    switch (msg.type) {
      case "proxy":
        try {
          const res = await fetch(
            globalConfig.exampleDevUrl + "/" + msg.params.path,
            {
              headers: msg.params.headers,
              method: msg.params.method,
              body: msg.params.body,
            }
          );
          const body = await res.text();
          const headersMap: Record<string, string> = {};
          res.headers.forEach((val, key) => {
            headersMap[key] = val;
          });
          wsWrapper.sendMsg({
            type: "proxyResult",
            params: {
              requestId: msg.params.requestId,
              status: res.status,
              statusText: res.statusText,
              headers: headersMap,
              body: body,
            },
          });
        } catch (err) {
          console.error("fetch error", err);
          wsWrapper.sendMsg({
            type: "proxyError",
            params: {
              requestId: msg.params.requestId,
              message: err.message,
            },
          });
          return;
        }
        break;
      case "connection_error":
        log("need to show error to the user");
        // TODO
        break;
    }
  };
};

export const initWsClient = (): WsWrapper<typeof clientSchema> => {
  const ws = new WebSocket(globalConfig.routerWsUrl);
  initWebsocket(ws);
  const wrapper = new WsWrapper(ws);
  ws.onmessage = getMsgHandler(serverSchema, getHandler(wrapper));
  return wrapper;
};
