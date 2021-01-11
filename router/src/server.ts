import Koa from "koa";
import route from "koa-route";
import websockify from "koa-websocket";
import {
  Closeable,
  CloseableContainer,
  start as appServerStart,
} from "dev-in-prod-lib/src/appServer";
import { log } from "dev-in-prod-lib/src/log";
import { initDb } from "./db";

import next from "next";

export const start = async (
  port: number,
  dirname: string
): Promise<Closeable> => {
  const closeables = await Promise.all([
    initDb(),
    appServerStart(port, dirname, next, initKoaApp),
  ]);

  return new CloseableContainer(closeables);
};

const initKoaApp = async (): Promise<Koa> => {
  const app = websockify(new Koa());
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
