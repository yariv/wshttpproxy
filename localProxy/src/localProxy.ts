import { WsWrapper } from "../../lib/src/typedWs";
import { clientSchema, serverSchema } from "../../lib/src/wsSchema";
import { Connection } from "mysql2/promise";
import { ConnectionOptions } from "tls";
import { initWsClient } from "./wsClient";

export class LocalProxy {
  wsWrapper: WsWrapper<typeof serverSchema, typeof clientSchema> | null;
  routerWsUrl: string;
  routerDbConnOptions: ConnectionOptions;
  localServiceUrl: string;
  localDbPort: number;
  authToken: string;

  constructor(
    // routingSecret: string,
    routerWsUrl: string,
    routerDbConnOptions: ConnectionOptions,
    localServiceUrl: string,
    localDbPort: number,
    authToken: string
  ) {
    this.routerWsUrl = routerWsUrl;
    this.routerDbConnOptions = routerDbConnOptions;
    this.localServiceUrl = localServiceUrl;
    this.localDbPort = localDbPort;
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
