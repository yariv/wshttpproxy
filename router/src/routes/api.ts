import Router from "koa-router";
import { createApplicationHandler } from "../apiHandlers/createApplication";
import { createRouteHandler } from "../apiHandlers/createRoute";
import { createKoaRoute } from "../typedApi/koaAdapter";
import { typedApiSchema } from "../typedApiSchema";

export const router = new Router();
createKoaRoute("createApplication", router, createApplicationHandler);
createKoaRoute("createRoute", router, createRouteHandler);
