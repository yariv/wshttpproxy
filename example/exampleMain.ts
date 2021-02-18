import { AppServer, listenOnPort } from "dev-in-prod-lib/src/appServer";
import { globalConfig } from "dev-in-prod-lib/src/utils";
import Koa from "koa";
import Router from "koa-router";
import logger from "koa-logger";

export const exampleMain = async (port: number): Promise<AppServer> => {
  const app = new Koa();
  app.use(logger());
  const server = await listenOnPort(app, port);
  const appServer = new AppServer(server);
  const router = new Router();
  router.get("/", async (ctx) => {
    ctx.body = "Hi brent! " + appServer.port;
  });

  app.use(router.routes()).use(router.allowedMethods);
  return appServer;
};

if (require.main == module) {
  exampleMain(globalConfig.exampleProdPort);
}
