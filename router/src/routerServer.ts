import { AppServer, startNextServer } from "dev-in-prod-lib/src/appServer";
import { initWebsocket } from "dev-in-prod-lib/src/typedWs";
import Koa from "koa";
import logger from "koa-logger";
import route from "koa-route";
import { ConnectionOptions } from "mysql2";
import next from "next";
import { router as apiRouter } from "./api/router";
import { initDbProxy } from "./dbProxy";
import { prisma } from "./prisma";
import { SocketManager } from "./socketManager";
import websockify from "koa-websocket";

export const routerServerStart = async (
  port: number,
  dirname: string,
  dbProxyPort: number,
  remoteConnectionOptions: ConnectionOptions
): Promise<AppServer> => {
  const socketManager = new SocketManager();
  const appServer = await startNextServer(
    port,
    dirname,
    next,
    initKoaApp(socketManager)
  );

  const dbProxy = await initDbProxy(dbProxyPort, remoteConnectionOptions);
  await dbProxy.listen();
  console.log("Mysql proxy is listening on ", dbProxyPort);

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
