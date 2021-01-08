import Koa from "koa";
import next from "next";
import path from "path";
import { Closeable, AppServer } from "../../shared/src/appServer";

export const start = async (port: number): Promise<Closeable> => {
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
  // TODO handle errors
  const closeableServer = {
    close: async () => {
      await server.close();
    },
  };
  const closeableNextApp = {
    close: async () => {
      await (nextApp as any).close();
    },
  };

  return new AppServer([closeableServer, closeableNextApp]);
};
