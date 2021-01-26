import Koa from "koa";
import util from "util";
import { Server } from "http";
import route from "koa-route";

export interface Closeable {
  close(): Promise<void>;
}

export class CloseableContainer implements Closeable {
  closeables: Closeable[];

  constructor(closables: Closeable[]) {
    this.closeables = closables;
  }

  async close() {
    await Promise.all(this.closeables.map((closeable) => closeable.close()));
  }
}

export const start = async (
  port: number,
  dirname: string,
  // note: next is a parameter instead of an import to prevent
  // duplicate imports of react, which causes errors
  next: (params: any) => any,
  initKoaApp?: () => Promise<Koa>
): Promise<Closeable> => {
  const dev = process.env.NODE_ENV !== "production";

  const nextConf = require(dirname + "/next.config.js");
  const nextApp = next({ dev, conf: nextConf, dir: dirname });
  await nextApp.prepare();

  const requestHandler = nextApp.getRequestHandler();

  const app = initKoaApp ? await initKoaApp() : new Koa();

  app.use(async (ctx) => {
    await requestHandler(ctx.req, ctx.res);
  });

  const closeableKoaApp = await listenOnPort(app, port);

  const closeableNextApp = {
    close: async () => {
      // Unfortunately, Next Server's close() method is protected. Casting the Server
      // to 'any' lets us call it.
      await (nextApp as any).close();
    },
  };

  return new CloseableContainer([closeableKoaApp, closeableNextApp]);
};

interface CanListen {
  listen(port: number): Server;
}
export const listenOnPort = (
  app: CanListen,
  port: number
): Promise<Closeable> => {
  const promise = new Promise<Closeable>((resolve, reject) => {
    const server = app.listen(port);
    server.addListener("listening", () => {
      console.log("Listening on port ", port);
      const closeableServer = {
        close: util.promisify(server.close).bind(server),
      };
      resolve(closeableServer);
    });
    server.addListener("error", () => {
      console.error("Error listening on port ", port);
      reject();
    });
  });
  return promise;
};
