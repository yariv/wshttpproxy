import Router from "@koa/router";
import { WsWrapper } from "dev-in-prod-lib/src/typedWs";
import { globalConfig } from "dev-in-prod-lib/src/utils";
import { clientSchema2, serverSchema2 } from "dev-in-prod-lib/src/wsSchema";
import Koa from "koa";
import storage from "node-persist";
// TODO fix import
import { createKoaRoute } from "../../router/src/typedApi/koaAdapter";
import { localProxyApiSchema } from "./localProxyApiSchema";
import { initWsClient } from "./wsClient";

export let openWebSocket: WsWrapper<typeof serverSchema2, typeof clientSchema2>;

export const initKoaApp = async (applicationSecret: string): Promise<Koa> => {
  await storage.init();
  const apiRouter = new Router({ prefix: globalConfig.apiPathPrefix });
  createKoaRoute(localProxyApiSchema, "setToken", async ({ token }) => {
    await storage.setItem("token", token);
  })(apiRouter);

  createKoaRoute(localProxyApiSchema, "setRouteKey", async ({ routeKey }) => {
    if (openWebSocket) {
      console.log("Closing open websocket");
      openWebSocket.ws.close();
    }
    openWebSocket = initWsClient();
    const authToken = await storage.getItem("token");
    openWebSocket.ws.on("open", () => {
      openWebSocket.sendMsg<"connect">({
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
