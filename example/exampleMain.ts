import { AppServer, listenOnPort } from "dev-in-prod-lib/src/appServer";
import { globalConfig } from "dev-in-prod-lib/src/utils";
import Koa from "koa";
import Router from "koa-router";
import logger from "koa-logger";
import mysql, { ConnectionOptions } from "mysql2/promise";
import escape from "escape-html";

export const exampleMain = async (port: number): Promise<AppServer> => {
  const app = new Koa();
  app.use(logger());
  const server = await listenOnPort(app, port);
  const appServer = new AppServer(server);
  const router = new Router();

  const connOptions: ConnectionOptions = {
    host: "localhost",
    port: globalConfig.routerDbProxyPort,
    user: "root",
    password: "root",
    database: "devinproddemo",
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
  return appServer;
};

if (require.main == module) {
  exampleMain(globalConfig.exampleProdPort);
}
