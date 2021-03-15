import Koa from "koa";
import logger from "koa-logger";
import route from "koa-route";
import websockify from "koa-websocket";
import { AppServer, listenOnPort } from "../../lib/src/appServer";
import { initWebsocket } from "../../lib/src/typedWs";
import { router as apiRouter } from "./api/router";
import { prisma } from "./prisma";
import { WsProxy } from "./wsProxy";

export const routerServerStart = async (
  port: number,
  routingSecret: string
): Promise<AppServer> => {
  const socketManager = new WsProxy(routingSecret);
  const koa = initKoaApp(socketManager);
  const server = await listenOnPort(koa, port);
  const appServer = new AppServer(server);

  appServer.onClose(async () => {
    socketManager.close();
    const promises: Promise<void>[] = [prisma.$disconnect()];
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
