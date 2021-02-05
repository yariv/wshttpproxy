import Router from "@koa/router";
import { WsWrapper } from "dev-in-prod-lib/src/typedWs";
import { globalConfig } from "dev-in-prod-lib/src/utils";
import { clientSchema, serverSchema } from "dev-in-prod-lib/src/wsSchema";
import Koa from "koa";
import storage from "node-persist";
// TODO fix import
import { createKoaRoute } from "../../router/src/typedApi/koaAdapter";
import { localProxyApiSchema } from "./localProxyApiSchema";
import { initWsClient } from "./wsClient";

export let wsWrapper: WsWrapper<typeof serverSchema, typeof clientSchema>;

export const initKoaApp = async (applicationSecret: string): Promise<Koa> => {
  await storage.init();
  const apiRouter = new Router({ prefix: globalConfig.apiPathPrefix });
  createKoaRoute(localProxyApiSchema, "setToken", async ({ token }) => {
    await storage.setItem("token", token);
  })(apiRouter);

  createKoaRoute(localProxyApiSchema, "setRouteKey", async ({ routeKey }) => {
    if (wsWrapper) {
      console.log("Closing open websocket");
      wsWrapper.ws.close();
    }
    wsWrapper = initWsClient();
    const authToken = await storage.getItem("token");
    wsWrapper.ws.on("open", () => {
      wsWrapper.sendMsg("connect", {
        authToken,
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
