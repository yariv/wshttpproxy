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
  authToken: string;

  constructor(
    // applicationSecret: string,
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

    // TODO make sure SSL is used in prod
    const onProxyConn = async (conn: Connection) => {
      const authQuery = {
        type: "auth",
        params: {
          authToken,
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
    this.wsWrapper = initWsClient(this.routerWsUrl, this.localServiceUrl);
    this.wsWrapper.ws.on("open", () => {
      if (!this.wsWrapper) {
        console.error("Lost websocket");
        return;
      }
      this.wsWrapper.sendMsg("connect", {
        authToken: this.authToken,
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
