import { AppServer, startNextServer } from "dev-in-prod-lib/src/appServer";
import { initWebsocket } from "dev-in-prod-lib/src/typedWs";
import Koa from "koa";
import logger from "koa-logger";
import route from "koa-route";
import websockify from "koa-websocket";
import next from "next";
import { router as apiRouter } from "./api/router";
import { prisma } from "./prisma";
import { SocketManager } from "./socketManager";
import { Server } from "ws";

export const routerServerStart = async (
  port: number,
  dirname: string
): Promise<AppServer> => {
  const socketManager = new SocketManager();
  const appServer = await startNextServer(
    port,
    dirname,
    next,
    initKoaApp(socketManager)
  );
  appServer.onClose(async () => {
    socketManager.close();
    await prisma.$disconnect();
  });

  var WebSocketServer = require("ws").Server,
    wss = new WebSocketServer({ port: 8010 });
  wss.on("connection", function (ws: any) {
    ws.on("message", function (message: any) {
      console.log("Received from client: %s", message);
      ws.send("Server received from client: " + message);
    });
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
