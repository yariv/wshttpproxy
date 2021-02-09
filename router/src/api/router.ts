import { globalConfig } from "dev-in-prod-lib/dist/utils";
import Router from "koa-router";
import { createApplicationHandler } from "./handlers/createApplication";
import { createRouteHandler } from "./handlers/createRoute";
import { createTestOAuthTokenHandler } from "./handlers/createTestOAuthToken";

export const router = new Router({
  prefix: globalConfig.apiPathPrefix,
});
createApplicationHandler(router);
createRouteHandler(router);
createTestOAuthTokenHandler(router);
