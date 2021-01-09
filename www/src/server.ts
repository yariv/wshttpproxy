import Koa from "koa";
import route from "koa-route";
import websockify from "koa-websocket";
import { Closeable, start as appServerStart } from "../../shared/src/appServer";
import { log } from "../../shared/src/log";
import { initDb } from "./db";

export const start = async (
  port: number,
  dirname: string
): Promise<Closeable> => {
  const closeables = await Promise.all([
    initDb(),
    appServerStart(port, dirname, initKoaApp),
  ]);

  return {
    close: async (): Promise<void> => {
      await Promise.all(closeables.map((closeable) => closeable.close()));
    },
  };
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
