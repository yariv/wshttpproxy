import * as z from "zod";
// TODO fix import
import { createKoaRoute } from "../../router/src/typedApi/koaAdapter";
import storage from "node-persist";
import { initWsClient } from "./wsClient";
import Router from "@koa/router";
import Koa from "koa";

const apiSchema = {
  setToken: {
    req: z.object({
      token: z.string(),
    }),
    res: z.void(),
  },
  setRouteKey: {
    req: z.object({
      routeKey: z.string(),
    }),
    res: z.void(),
  },
};

export const initKoaApp = (applicationSecret: string): (() => Promise<Koa>) => {
  const apiRouter = new Router();
  createKoaRoute(apiSchema, "setToken", async ({ token }) => {
    await storage.set("token", token);
  })(apiRouter);

  createKoaRoute(apiSchema, "setRouteKey", async ({ routeKey }) => {
    const wsWrapper = initWsClient();
    const authToken = await storage.get("token");
    wsWrapper.sendMsg({
      type: "connect",
      body: { authToken, routeKey, applicationSecret },
    });
  })(apiRouter);

  const app = new Koa();
  app.use(apiRouter.routes());
  app.use(apiRouter.allowedMethods());
  return () => Promise.resolve(app);
};
