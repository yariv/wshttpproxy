import { Server } from "http";
import Koa from "koa";
import util from "util";

export const appServerStart = async (
  port: number,
  dirname: string,
  // note: next is a parameter instead of an import to prevent
  // duplicate imports of react, which causes errors
  next: (params: any) => any,
  koaApp?: Koa
): Promise<() => Promise<void>> => {
  const dev = process.env.NODE_ENV !== "production";

  const nextConf = require(dirname + "/next.config.js");
  const nextApp = next({ dev, conf: nextConf, dir: dirname });
  await nextApp.prepare();

  const requestHandler = nextApp.getRequestHandler();

  const app = koaApp || new Koa();

  app.use(async (ctx) => {
    await requestHandler(ctx.req, ctx.res);
  });

  const closeKoaFunc = await listenOnPort(app, port);

  const closeNextFunc = async () => {
    // Unfortunately, 'close' is a protected method, so we cast
    // nextApp as any to be able to access it.
    await (nextApp as any).close();
  };

  return async () => {
    await Promise.all([closeKoaFunc(), closeNextFunc()]);
  };
};

interface CanListen {
  listen(port: number): Server;
}
export const listenOnPort = (
  app: CanListen,
  port: number
): Promise<() => Promise<void>> => {
  return new Promise<() => Promise<void>>((resolve, reject) => {
    const server = app.listen(port);
    server.addListener("listening", () => {
      console.log("Listening on port ", port);
      resolve(() => {
        return util.promisify(server.close.bind(server))();
      });
    });
    server.addListener("error", () => {
      console.error("Error listening on port ", port);
      reject();
    });
  });
};
