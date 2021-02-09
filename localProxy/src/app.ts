import Router from "@koa/router";
import { WsWrapper } from "dev-in-prod-lib/dist/typedWs";
import { globalConfig } from "dev-in-prod-lib/dist/utils";
import { clientSchema, serverSchema } from "dev-in-prod-lib/dist/wsSchema";
import Koa from "koa";
import storage from "node-persist";
// TODO fix import
import { localProxyApiSchema } from "./localProxyApiSchema";
import { initWsClient } from "./wsClient";
import { createKoaRoute } from "typed-api/src/koaAdapter";

export let wsWrapper: WsWrapper<typeof serverSchema, typeof clientSchema>;

export const initKoaApp = async (applicationSecret: string): Promise<Koa> => {
  await storage.init();
  const apiRouter = new Router({ prefix: globalConfig.apiPathPrefix });

  createKoaRoute(localProxyApiSchema, "setToken", async ({ token }) => {
    await storage.setItem("oauthToken", token);
  })(apiRouter);

  createKoaRoute(localProxyApiSchema, "setRouteKey", async ({ routeKey }) => {
    if (wsWrapper) {
      console.log("Closing open websocket");
      wsWrapper.ws.close();
    }
    wsWrapper = initWsClient();
    const oauthToken = await storage.getItem("oauthToken");
    wsWrapper.ws.on("open", () => {
      wsWrapper.sendMsg("connect", {
        oauthToken,
        routeKey,
        applicationSecret,
      });
    });
  })(apiRouter);

  const app = new Koa();
  app.use(apiRouter.routes());
  app.use(apiRouter.allowedMethods());
  return app;
};
