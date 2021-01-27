import Router from "koa-router";
import { createApplicationHandler } from "../apiHandlers/createApplication";
import { createRouteHandler } from "../apiHandlers/createRoute";
import { createKoaRoute } from "../typedApi/koaAdapter";
import { typedApiSchema } from "../typedApiSchema";

export const router = new Router();
createKoaRoute(
  typedApiSchema,
  "createApplication",
  router,
  createApplicationHandler
);
createKoaRoute(typedApiSchema, "createRoute", router, createRouteHandler);
