import { Closeable, start } from "dev-in-prod-lib/src/appServer";
import { globalConfig } from "dev-in-prod-lib/src/globalConfig";
import Koa from "koa";
import Router from "koa-router";

export const main = (port: number): Closeable => {
  const app = new Koa();
  const router = new Router();
  router.get("/", async (ctx, next) => {
    ctx.body = "hi";
    await next();
  });
  app.use(router.routes()).use(router.allowedMethods);
  const server = app.listen(port);
  return {
    close: async () => {
      // TODO handle errors
      await server.close();
    },
  };
};

if (require.main == module) {
  main(globalConfig.exampleProdPort);
}
