import { AppServer, listenOnPort } from "dev-in-prod-lib/src/appServer";
import { globalConfig } from "dev-in-prod-lib/src/utils";
import Koa from "koa";
import Router from "koa-router";
import logger from "koa-logger";
import mysql, { Connection, ConnectionOptions } from "mysql2/promise";
import escape from "escape-html";

class Example {
  appServer: AppServer;
  conn: mysql.Connection;

  constructor(appServer: AppServer, conn: Connection) {
    this.appServer = appServer;
    this.conn = conn;
  }

  async close() {
    this.conn.destroy();
    await this.appServer.close();
  }
}
export const exampleMain = async (
  port: number,
  dbPort: number
): Promise<Example> => {
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
    console.log(results);
    const body = results.length
      ? "<h1>posts</h1><ul>" +
        results
          .map((result: any) => "<li>" + escape(result.content) + "</li>")
          .join(" ") +
        "</ul>"
      : "<h1>no posts</h1>";
    ctx.body = body;
  });

  app.use(router.routes()).use(router.allowedMethods);
  return new Example(appServer, conn);
};

if (require.main == module) {
  exampleMain(globalConfig.exampleProdPort, globalConfig.routerDbProxyPort);
}
