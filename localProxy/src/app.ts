import * as z from "zod";
// TODO fix import
import { createKoaRoute } from "../../router/src/typedApi/koaAdapter";
import storage from "node-persist";
import { initWsClient } from "./wsClient";
import Router from "@koa/router";
import Koa from "koa";
import { localProxyApiSchema } from "./localProxyApiSchema";
import { globalConfig } from "dev-in-prod-lib/src/utils";
import { WsWrapper } from "dev-in-prod-lib/src/typedWs";
import { clientSchema } from "dev-in-prod-lib/src/wsSchema";

export let openWebSocket: WsWrapper<typeof clientSchema>;

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
      openWebSocket.sendMsg({
        type: "connect",
        params: { authToken, routeKey, applicationSecret },
      });
    });
  })(apiRouter);

  const app = new Koa();
  app.use(apiRouter.routes());
  app.use(apiRouter.allowedMethods());
  return app;
};
