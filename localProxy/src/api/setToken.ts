import * as z from "zod";
// TODO fix import
import { createKoaRoute } from "../../../router/src/typedApi/koaAdapter";
import storage from "node-persist";
import { initWsClient } from "../wsClient";
import Router from "@koa/router";

const apiRouter = new Router();

const schema = {
  setToken: {
    req: z.object({
      token: z.string(),
    }),
    res: z.void(),
  },
};

createKoaRoute(apiRouter, schema, "setToken", async ({ token }) => {
  await storage.set("token", token);
  const wsClient = initWsClient(token);
});
