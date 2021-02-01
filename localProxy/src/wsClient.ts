import {
  WsHandlerType,
  initWebsocket,
  WsWrapper,
  getMsgHandler,
} from "dev-in-prod-lib/src/typedWs";
import { clientSchema2, serverSchema2 } from "dev-in-prod-lib/src/wsSchema";
import WebSocket from "ws";
import { globalConfig } from "../../lib/src/utils";

const getHandler = (
  wsWrapper: WsWrapper<typeof clientSchema2>
): WsHandlerType<typeof serverSchema2> => {
  return async (msg) => {
    console.log("got message", msg);
    switch (msg.type) {
      case "proxy":
        try {
          const res = await fetch(globalConfig.exampleDevUrl, {
            headers: msg.body.headers,
            method: msg.body.method,
            body: msg.body.body,
          });
          const body = await res.text();
          const headersMap: Record<string, string> = {};
          res.headers.forEach((val, key) => {
            headersMap[key] = val;
          });
          wsWrapper.sendMsg({
            type: "proxyResult",
            body: {
              status: res.status,
              headers: headersMap,
              body: body,
            },
          });
        } catch (err) {
          console.error("fetch error");
          wsWrapper.sendMsg({
            type: "proxyError",
            body: {
              message: err.message,
            },
          });
          return;
        }
        break;
      case "unauthorized":
        break;
    }
  };
};

export const initWsClient = (token: string) => {
  const ws = new WebSocket(globalConfig.routerWsUrl);
  initWebsocket(ws);
  ws.onmessage = getMsgHandler(serverSchema2, getHandler(new WsWrapper(ws)));
};
