import { WsHandlerType, initWebsocket } from "dev-in-prod-lib/src/typedWs";
import { clientSchema2, serverSchema2 } from "dev-in-prod-lib/src/wsSchema";
import WebSocket from "ws";
import { globalConfig } from "../../lib/src/utils";

const handler: WsHandlerType<typeof serverSchema2> = async (msg) => {
  switch (msg.type) {
    case "proxy":
      const res = await fetch(globalConfig.exampleDevUrl, {
        headers: msg.body.headers,
        method: msg.body.method,
        body: msg.body.body,
      });
      break;
    case "unauthorized":
      break;
  }
};

export const initWsClient = (token: string) => {
  const ws = new WebSocket(globalConfig.routerWsUrl);
  initWebsocket(ws);
};
