import {
  Closeable,
  CloseableContainer,
  start as appServerStart,
} from "dev-in-prod-lib/src/appServer";
import { log } from "dev-in-prod-lib/src/log";
import { initWebsocket } from "dev-in-prod-lib/src/typedWs";
import Koa from "koa";
import route from "koa-route";
import websockify from "koa-websocket";
import next from "next";
import { router as apiRouter } from "./apiHandlers/router";
import { SocketManager } from "./socketManager";

export const start = async (
  port: number,
  dirname: string
): Promise<Closeable> => {
  const socketManager = new SocketManager();
  const closeable = await appServerStart(
    port,
    dirname,
    next,
    initKoaApp(socketManager)
  );
  return new CloseableContainer([closeable, socketManager]);
};

const initKoaApp = (socketManager: SocketManager): Koa => {
  const koa = new Koa();
  koa.use((ctx, next) => {
    log("router request", ctx.host, ctx.hostname, ctx.headers, ctx.path);
    return next();
  });
  koa.use(socketManager.proxyMiddleware.bind(socketManager));
  koa.use(apiRouter.allowedMethods());
  koa.use(apiRouter.routes());

  // TODO use https
  const app = websockify(koa);
  app.ws.use(
    route.all("/ws", (ctx) => {
      initWebsocket(ctx.websocket);
      socketManager.registerWebSocket(ctx.websocket);
    })
  );
  return app;
};
