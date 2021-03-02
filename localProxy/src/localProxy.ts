import { MySqlProxy } from "dev-in-prod-db-proxy/src/mysqlProxy";
import { WsWrapper } from "dev-in-prod-lib/src/typedWs";
import { clientSchema, serverSchema } from "dev-in-prod-lib/src/wsSchema";
import { Connection } from "mysql2/promise";
import { ConnectionOptions } from "tls";
import { initWsClient } from "./wsClient";

export class LocalProxy {
  wsWrapper: WsWrapper<typeof serverSchema, typeof clientSchema> | null;
  routerWsUrl: string;
  routerDbConnOptions: ConnectionOptions;
  localServiceUrl: string;
  localDbPort: number;
  dbProxy: MySqlProxy;
  oauthToken: string;

  constructor(
    // applicationSecret: string,
    routerWsUrl: string,
    routerDbConnOptions: ConnectionOptions,
    localServiceUrl: string,
    localDbPort: number,
    oauthToken: string
  ) {
    this.routerWsUrl = routerWsUrl;
    this.routerDbConnOptions = routerDbConnOptions;
    this.localServiceUrl = localServiceUrl;
    this.localDbPort = localDbPort;
    this.oauthToken = oauthToken;

    this.wsWrapper = null;

    // TODO make sure SSL is used in prod
    const onProxyConn = async (conn: Connection) => {
      const authQuery = {
        type: "auth",
        params: {
          oauthToken,
        },
      };
      try {
        await conn.query(JSON.stringify(authQuery));
      } catch (e) {
        console.error("Error authenticating against remote DB", e);
        throw e;
      }
    };

    const dbProxy = new MySqlProxy(this.localDbPort, this.routerDbConnOptions);
    dbProxy.onProxyConn = onProxyConn;
    this.dbProxy = dbProxy;
  }

  async connectWs() {
    //const routeKey = await this.getRouteKey();
    if (this.wsWrapper) {
      console.log("Closing open websocket");
      this.wsWrapper.ws.close();
    }
    this.wsWrapper = initWsClient(this.routerWsUrl, this.localServiceUrl);
    this.wsWrapper.ws.on("open", () => {
      if (!this.wsWrapper) {
        console.error("Lost websocket");
        return;
      }
      this.wsWrapper.sendMsg("connect", {
        oauthToken: this.oauthToken,
      });
    });
    this.wsWrapper.ws.on("close", () => {
      this.wsWrapper = null;
    });
  }

  async listen(port: number, dirname: string, next: any) {
    await this.dbProxy.listen();
  }

  async close() {
    this.wsWrapper?.ws.close();
    await this.dbProxy.close();
  }
}
