import { AppServer, listenOnPort } from "dev-in-prod-lib/src/appServer";
import { initWebsocket } from "dev-in-prod-lib/src/typedWs";
import Koa from "koa";
import logger from "koa-logger";
import route from "koa-route";
import websockify from "koa-websocket";
import { ConnectionOptions } from "mysql2";
import { router as apiRouter } from "./api/router";
import { DbProxy } from "./dbProxy";
import { prisma } from "./prisma";
import { SocketManager } from "./socketManager";

export const routerServerStart = async (
  port: number,
  dbProxyPort: number,
  remoteConnectionOptions: ConnectionOptions
): Promise<AppServer> => {
  const socketManager = new SocketManager();
  const koa = initKoaApp(socketManager);
  const server = await listenOnPort(koa, port);
  const appServer = new AppServer(server);

  const dbProxy = new DbProxy(dbProxyPort, remoteConnectionOptions);
  await dbProxy.listen();

  appServer.onClose(async () => {
    socketManager.close();
    await Promise.all([prisma.$disconnect(), dbProxy.close()]);
  });

  return appServer;
};

const initKoaApp = (socketManager: SocketManager): Koa => {
  const koa = new Koa();
  koa.use(logger());
  koa.use(socketManager.proxyMiddleware.bind(socketManager));
  koa.use(apiRouter.allowedMethods());
  koa.use(apiRouter.routes());

  const app = websockify(koa);
  app.ws.use(
    route.all("/ws", (ctx) => {
      initWebsocket(ctx.websocket);
      socketManager.registerWebSocket(ctx.websocket);
    })
  );
  return app;
};
