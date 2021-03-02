import { AppServer, listenOnPort } from "dev-in-prod-lib/src/appServer";
import { globalConfig } from "dev-in-prod-lib/src/utils";
import Koa from "koa";
import Router from "koa-router";
import logger from "koa-logger";
import mysql, { ConnectionOptions } from "mysql2/promise";
import escape from "escape-html";

export const exampleMain = async (
  port: number,
  dbPort: number
): Promise<AppServer> => {
  const app = new Koa();
  app.use(logger());
  const server = await listenOnPort(app, port);
  const appServer = new AppServer(server);
  const router = new Router();

  const connOptions: ConnectionOptions = {
    ...globalConfig.defaultDbConnOptions,
    port: dbPort,
  };
  const conn = await mysql.createConnection(connOptions);

  router.get("/", async (ctx) => {
    const [results] = (await conn.query("select * from post")) as any;
    const body = results.length
      ? "<h1>posts</h1>" +
        results
          .map((result: string) => "<div>" + escape(result) + "</div>")
          .join(" ")
      : "<h1>no posts</h1>";
    ctx.body = body;
  });

  app.use(router.routes()).use(router.allowedMethods);
  appServer.onClose(async () => conn.destroy());
  return appServer;
};

if (require.main == module) {
  exampleMain(globalConfig.exampleProdPort, globalConfig.localProxyDbProxyPort);
}
