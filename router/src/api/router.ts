import { routerApiSchema } from "../../../lib/src/routerApiSchema";
import { globalConfig } from "../../../lib/src/utils";
import Router from "koa-router";
import { createKoaRoute } from "infer-rpc/dist/koaAdapter";
import { createAuthToken } from "../utils";

export const router = new Router({
  prefix: globalConfig.apiPathPrefix,
});

createKoaRoute(
  router,
  routerApiSchema,
  "createAuthToken",
  async (body, req) => {
    if (!req.socket.remoteAddress?.endsWith("127.0.0.1")) {
      throw new Error("This endpoint is only callable from localhost.");
    }
    const authToken = await createAuthToken();
    return { authToken };
  }
);
