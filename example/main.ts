import { Closeable } from "dev-in-prod-lib/src/appServer";
import Koa from "koa";
import Router from "koa-router";
import util from "util";
import { globalConfig } from "../lib/src/utils";

export const main = (port: number): Closeable => {
  const app = new Koa();
  const router = new Router();
  router.get("/", async (ctx, next) => {
    ctx.body = "" + port;
    await next();
  });
  app.use(router.routes()).use(router.allowedMethods);
  const server = app.listen(port);

  return {
    close: util.promisify(server.close).bind(server),
  };
};

if (require.main == module) {
  main(globalConfig.exampleProdPort);
}
