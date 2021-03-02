import { globalConfig } from "dev-in-prod-lib/src/utils";
import Router from "koa-router";
import { createAuthTokenHandler } from "./handlers/createAuthToken";

export const router = new Router({
  prefix: globalConfig.apiPathPrefix,
});
createAuthTokenHandler(router);
