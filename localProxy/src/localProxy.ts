import Router from "@koa/router";
import { assert } from "console";
import { AppServer, startNextServer } from "dev-in-prod-lib/src/appServer";
import { routerApiSchema } from "dev-in-prod-lib/src/routerApiSchema";
import { WsWrapper } from "dev-in-prod-lib/src/typedWs";
import { globalConfig } from "dev-in-prod-lib/src/utils";
import { clientSchema, serverSchema } from "dev-in-prod-lib/src/wsSchema";
import Koa from "koa";
import logger from "koa-logger";
import storage from "node-persist";
import { TypedHttpClient } from "typed-api/src/httpApi";
import { createKoaRoute } from "typed-api/src/koaAdapter";
import { localProxyApiSchema } from "./localProxyApiSchema";
import { initWsClient } from "./wsClient";
import { MySqlProxy } from "dev-in-prod-db-proxy/src/mysqlProxy";
import { ConnectionOptions } from "tls";
import { Connection } from "mysql2/promise";

type StorageKey = "oauthToken" | "routeKey";

export class LocalProxy {
  wsWrapper: WsWrapper<typeof serverSchema, typeof clientSchema> | null;
  app: Koa;
  appServer: AppServer | undefined;
  routerClient: TypedHttpClient<typeof routerApiSchema>;
  applicationSecret: string;
  routerWsUrl: string;
  routerDbConnOptions: ConnectionOptions;
  localServiceUrl: string;
  localDbPort: number;

  constructor(
    applicationSecret: string,
    routerApiUrl: string,
    routerWsUrl: string,
    routerDbConnOptions: ConnectionOptions,
    localServiceUrl: string,
    localDbPort: number
  ) {
    this.applicationSecret = applicationSecret;
    this.routerWsUrl = routerWsUrl;
    this.routerDbConnOptions = routerDbConnOptions;
    this.localServiceUrl = localServiceUrl;
    this.localDbPort = localDbPort;

    this.wsWrapper = null;

    const apiRouter = new Router({ prefix: globalConfig.apiPathPrefix });
    this.routerClient = new TypedHttpClient(routerApiUrl, routerApiSchema);

    createKoaRoute(localProxyApiSchema, "setToken", async ({ oauthToken }) => {
      await this.store("oauthToken", oauthToken);
      await this.connectWs();
    })(apiRouter);

    createKoaRoute(localProxyApiSchema, "connect", async () =>
      this.connectWs()
    )(apiRouter);

    const app = new Koa();
    app.use(logger());
    app.use(apiRouter.routes());
    app.use(apiRouter.allowedMethods());
    this.app = app;
  }

  async getStored(key: StorageKey) {
    return storage.getItem(this.applicationSecret + "_" + key);
  }

  async store(key: StorageKey, val: any) {
    return storage.setItem(this.applicationSecret + "_" + key, val);
  }

  async getOAuthToken() {
    const oauthToken = await this.getStored("oauthToken");
    if (!oauthToken) {
      throw new Error("Not authenticated");
    }
    return oauthToken;
  }

  async getRouteKey(oauthToken: string) {
    let routeKey = await this.getStored("routeKey");
    if (!routeKey) {
      console.log("Creating new route");
      const res = await this.routerClient.call("createRoute", {
        oauthToken,
        applicationSecret: this.applicationSecret,
      });
      routeKey = res.routeKey;
      await this.store("routeKey", routeKey);
    }
    console.log("Using route key:", routeKey);
    return routeKey;
  }

  async connectWs() {
    const oauthToken = await this.getOAuthToken();
    const routeKey = await this.getRouteKey(oauthToken);
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
        oauthToken,
        routeKey,
        applicationSecret: this.applicationSecret,
      });
    });
    this.wsWrapper.ws.on("close", () => {
      this.wsWrapper = null;
    });
  }

  async connectDb() {
    const oauthToken = await this.getOAuthToken();
    // TODO make sure SSL is used in prod
    const onProxyConn = async (conn: Connection) => {
      const authQuery = {
        type: "auth",
        params: {
          oauthToken,
          applicationSecret: this.applicationSecret,
        },
      };
      try {
        await conn.query(JSON.stringify(authQuery));
      } catch (e) {
        console.error("Error authenticating against remote DB", e);
        throw e;
      }
    };

    const dbProxy = new MySqlProxy(
      this.localDbPort,
      this.routerDbConnOptions,
      onProxyConn
    );
    await dbProxy.listen();
  }

  async listen(port: number, dirname: string, next: any) {
    assert(!this.appServer);
    await storage.init();
    this.appServer = await startNextServer(port, dirname, next, this.app);
  }

  async close() {
    this.wsWrapper?.ws.close();
    return this.appServer?.close();
  }
}
