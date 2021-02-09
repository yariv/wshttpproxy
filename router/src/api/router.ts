import { globalConfig } from "dev-in-prod-lib/dist/utils";
import Router from "koa-router";
import { createApplicationHandler } from "./createApplication";
import { createRouteHandler } from "./createRoute";

export const router = new Router({
  prefix: globalConfig.apiPathPrefix,
});
createApplicationHandler(router);
createRouteHandler(router);
