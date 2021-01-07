import Koa from "koa";
import next from "next";
import path from "path";

export const start = async (port: number): Promise<any> => {
  const dev = process.env.NODE_ENV !== "production";
  const nextConf = require("../next.config.js");
  const parentDir = path.resolve(__dirname, "..");
  const nextApp = next({ dev, conf: nextConf, dir: parentDir });

  await nextApp.prepare();
  const requestHandler = nextApp.getRequestHandler();

  const app = new Koa();
  app.use(async (ctx) => {
    await requestHandler(ctx.req, ctx.res);
  });
  const server = app.listen(port);
  return server;
};
