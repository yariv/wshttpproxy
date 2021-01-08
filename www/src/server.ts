import Koa from "koa";
import route from "koa-route";
import websockify from "koa-websocket";
import { Closeable, start as appServerStart } from "../../shared/src/appServer";
import { log } from "../../shared/src/log";
import { initDb } from "./db";

export const start = (port: number, dirname: string): Promise<Closeable> => {
  return appServerStart(port, dirname, initKoaApp);
};

const initKoaApp = async (): Promise<Koa> => {
  await initDb();
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
