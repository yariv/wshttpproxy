import { Server } from "http";
import Koa from "koa";
import util from "util";
import { getApiUrl, getHttpUrl } from "./utils";

export class AppServer {
  server: Server;
  private onCloseFuncs: (() => Promise<void>)[] = [];

  constructor(server: Server) {
    this.server = server;
    this.onCloseFuncs.push(util.promisify(server.close.bind(server)));
  }

  async onClose(func: () => Promise<void>) {
    this.onCloseFuncs.push(func);
  }

  async close() {
    await Promise.all(this.onCloseFuncs.map((func) => func()));
  }

  get url(): string {
    return getHttpUrl(this.serverPort);
  }

  get serverPort(): number {
    return (this.server.address as any).port;
  }

  get apiUrl(): string {
    return getApiUrl(this.serverPort);
  }
}

export const appServerStart = async (
  port: number,
  dirname: string,
  // note: next is a parameter instead of an import to prevent
  // duplicate imports of react, which causes errors
  next: (params: any) => any,
  koaApp?: Koa
): Promise<AppServer> => {
  const dev = process.env.NODE_ENV !== "production";

  const nextConf = require(dirname + "/next.config.js");
  const nextApp = next({ dev, conf: nextConf, dir: dirname });
  await nextApp.prepare();

  const requestHandler = nextApp.getRequestHandler();

  const app = koaApp || new Koa();

  app.use(async (ctx) => {
    await requestHandler(ctx.req, ctx.res);
  });

  const appServer = await listenOnPort(app, port);

  const closeNextFunc = async () => {
    // Unfortunately, 'close' is a protected method, so we cast
    // nextApp as any to be able to access it.
    await (nextApp as any).close();
  };
  appServer.onClose(closeNextFunc);
  return appServer;
};

interface CanListen {
  listen(port: number): Server;
}
export const listenOnPort = (
  app: CanListen,
  port: number
): Promise<AppServer> => {
  return new Promise((resolve, reject) => {
    const server = app.listen(port);
    server.addListener("listening", () => {
      console.log("Listening on port ", port);
      resolve(new AppServer(server));
    });
    server.addListener("error", () => {
      reject("Error listening on port " + port);
    });
  });
};
