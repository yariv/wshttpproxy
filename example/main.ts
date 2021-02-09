import Koa from "koa";
import Router from "koa-router";
import util from "util";
import { globalConfig } from "dev-in-prod-lib/dist/utils";

export const exampleMain = (port: number): (() => Promise<void>) => {
  const app = new Koa();
  const router = new Router();
  router.get("/", async (ctx) => {
    ctx.body = "" + port;
  });
  app.use(router.routes()).use(router.allowedMethods);
  const server = app.listen(port, undefined, undefined, () => {
    console.log("listening", port);
  });

  return util.promisify(server.close.bind(server));
};

if (require.main == module) {
  exampleMain(globalConfig.exampleProdPort);
}
