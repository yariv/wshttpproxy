import Koa from "koa";
import next from "next";

export interface Closeable {
  close(): Promise<void>;
}

export class AppServer implements Closeable {
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

  const server = app.listen(port);

  // TODO handle errors
  const closeableServer = {
    close: async () => {
      await server.close();
    },
  };

  const closeableNextApp = {
    close: async () => {
      // Unfortunately, Next Server's close() method is protected. Casting the Server
      // to 'any' lets us call it.
      await (nextApp as any).close();
    },
  };

  return new AppServer([closeableServer, closeableNextApp]);
};
