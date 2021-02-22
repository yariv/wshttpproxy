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
// TODO fix import
import { localProxyApiSchema } from "./localProxyApiSchema";
import { initWsClient } from "./wsClient";

export class LocalProxy {
  wsWrapper: WsWrapper<typeof serverSchema, typeof clientSchema> | null;
  app: Koa;
  appServer: AppServer | undefined;

  constructor(
    applicationSecret: string,
    routerApiUrl: string,
    routerWsUrl: string,
    localServiceUrl: string
  ) {
    this.wsWrapper = null;

    const apiRouter = new Router({ prefix: globalConfig.apiPathPrefix });
    const client = new TypedHttpClient(routerApiUrl, routerApiSchema);

    createKoaRoute(localProxyApiSchema, "setToken", async ({ oauthToken }) => {
      await storage.setItem("oauthToken", oauthToken);
    })(apiRouter);

    createKoaRoute(localProxyApiSchema, "connect", async () => {
      const oauthToken = await storage.getItem("oauthToken");
      if (!oauthToken) {
        throw new Error("Not authenticated");
      }
      const routeKey = await storage.getItem("routeKey");
      if (!routeKey) {
        console.log("Creating new route");
        const { routeKey } = await client.call("createRoute", {
          oauthToken: oauthToken,
          applicationSecret: applicationSecret,
        });
        await storage.setItem("routeKey", routeKey);
      }
      console.log("Using route key:", routeKey);

      if (this.wsWrapper) {
        console.log("Closing open websocket");
        this.wsWrapper.ws.close();
      }
      this.wsWrapper = initWsClient(routerWsUrl, localServiceUrl);
      this.wsWrapper.ws.on("open", () => {
        if (!this.wsWrapper) {
          console.error("Lost websocket");
          return;
        }
        this.wsWrapper.sendMsg("connect", {
          oauthToken,
          routeKey,
          applicationSecret,
        });
      });
      this.wsWrapper.ws.on("close", () => {
        console.log("Websocket closed");
        this.wsWrapper = null;
      });
    })(apiRouter);

    const app = new Koa();
    app.use(logger());
    app.use(apiRouter.routes());
    app.use(apiRouter.allowedMethods());
    this.app = app;
  }

  async listen(port: number, dirname: string, next: any) {
    assert(!this.appServer);
    await storage.init();
    this.appServer = await startNextServer(port, dirname, next, this.app);
  }

  async close() {
    return this.appServer?.close();
  }
}
