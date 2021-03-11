import { AppServer, listenOnPort } from "../../lib/src/appServer";
import { initWebsocket } from "../../lib/src/typedWs";
import Koa from "koa";
import logger from "koa-logger";
import route from "koa-route";
import websockify from "koa-websocket";
import { ConnectionOptions } from "mysql2";
import { router as apiRouter } from "./api/router";
import { DbProxy } from "./dbProxy";
import { prisma } from "./prisma";
import { WsProxy } from "./wsProxy";

export const routerServerStart = async (
  port: number,
  applicationSecret: string,
  dbProxyPort?: number,
  remoteConnectionOptions?: ConnectionOptions
): Promise<AppServer> => {
  const socketManager = new WsProxy(applicationSecret);
  const koa = initKoaApp(socketManager);
  const server = await listenOnPort(koa, port);
  const appServer = new AppServer(server);

  let dbProxy: DbProxy;
  if (dbProxyPort && remoteConnectionOptions) {
    dbProxy = new DbProxy(dbProxyPort, remoteConnectionOptions);
    await dbProxy.listen();
  }

  appServer.onClose(async () => {
    socketManager.close();
    const promises: Promise<void>[] = [prisma.$disconnect()];
    if (dbProxy) {
      promises.push(dbProxy.close());
    }
    await Promise.all(promises);
  });

  return appServer;
};

const initKoaApp = (socketManager: WsProxy): Koa => {
  const koa = new Koa();
  koa.use(logger());
  koa.use(socketManager.proxyMiddleware.bind(socketManager));
  koa.use(apiRouter.allowedMethods());
  koa.use(apiRouter.routes());

  const app = websockify(koa as any);
  app.ws.use(
    route.all("/ws", (ctx) => {
      initWebsocket(ctx.websocket);
      socketManager.registerWebSocket(ctx.websocket);
    })
  );
  return app as any;
};
