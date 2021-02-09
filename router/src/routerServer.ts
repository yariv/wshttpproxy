import { appServerStart } from "dev-in-prod-lib/dist/appServer";
import { log } from "dev-in-prod-lib/dist/log";
import { initWebsocket } from "dev-in-prod-lib/dist/typedWs";
import Koa from "koa";
import bodyParser from "koa-bodyparser";
import route from "koa-route";
import websockify from "koa-websocket";
import next from "next";
import { router as apiRouter } from "./api/router";
import { SocketManager } from "./socketManager";

export const routerServerStart = async (
  port: number,
  dirname: string
): Promise<() => Promise<void>> => {
  const socketManager = new SocketManager();
  const closeFunc = await appServerStart(
    port,
    dirname,
    next,
    initKoaApp(socketManager)
  );
  return async () => {
    socketManager.close();
    await closeFunc();
  };
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
