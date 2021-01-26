import {
  Closeable,
  start as appServerStart,
} from "dev-in-prod-lib/src/appServer";
import { globalConfig } from "dev-in-prod-lib/src/globalConfig";
import Koa from "koa";
import bodyParser from "koa-bodyparser";
import route from "koa-route";
import Router from "koa-router";
import websockify from "koa-websocket";
import next from "next";
import { log } from "../../lib/src/log";
import { router as apiRouter } from "./routes/api";

export const start = async (
  port: number,
  dirname: string
): Promise<Closeable> => {
  return await appServerStart(port, dirname, next, initKoaApp);
};

const initKoaApp = async (): Promise<Koa> => {
  const koa = new Koa();
  // koa.use(bodyParser());
  // koa.use(apiRouter.allowedMethods());
  // koa.use(apiRouter.routes());

  koa.use(async (ctx, next) => {
    if (ctx.header[globalConfig.sidecarProxyHeader]) {
      // handle proxy request
      const appSecret = 123;
      const routeId = 456;
      // TODO look up app from appSecret
      // look up appSecret/routeId combination

      return;
    }
    return next();
  });

  const app = websockify(koa);
  app.ws.use(
    route.all("/ws", (ctx) => {
      ctx.websocket.send("hi");
      ctx.websocket.on("message", (message) => {
        log(message);
        ctx.websocket.send("sup");
      });
    })
  );
  return app;
};
