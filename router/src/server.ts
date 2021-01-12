import Koa from "koa";
import route from "koa-route";
import websockify from "koa-websocket";
import {
  Closeable,
  CloseableContainer,
  start as appServerStart,
} from "dev-in-prod-lib/src/appServer";
import { log } from "../../lib/src/log";

import next from "next";
import { globalConfig } from "dev-in-prod-lib/src/globalConfig";

export const start = async (
  port: number,
  dirname: string
): Promise<Closeable> => {
  const closeables = await Promise.all([
    appServerStart(port, dirname, next, initKoaApp),
  ]);

  return new CloseableContainer(closeables);
};

const initKoaApp = async (): Promise<Koa> => {
  const koa = new Koa();
  koa.use(async (ctx, next) => {
    if (ctx.header[globalConfig.sidecarProxyHeader]) {
      // handle proxy request
      const appSecret = 123;
      const routeId = 456;
      // TODO look up app from appSecret
      // look up appSecret/routeId combination

      return;
    }
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
