import Koa from "koa";
import next from "next";
import route from "koa-route";
import websockify from "koa-websocket";

import { initDb } from "./db";
import { log } from "../../shared/src/log";
import { globalConfig } from "../../shared/src/globalConfig";

const dev = process.env.NODE_ENV !== "production";
const nextConf = require("../next.config.js");
const nextApp = next({ dev, conf: nextConf });
const app = websockify(new Koa());

// We use this initialization logic to create a db connection.
(async () => {
  await nextApp.prepare();
  const requestHandler = nextApp.getRequestHandler();
  await initDb();

  app.ws.use(
    route.all("/ws", (ctx) => {
      ctx.websocket.send("hi");
      ctx.websocket.on("message", (message) => {
        log(message);
        ctx.websocket.send("sup");
      });
    })
  );
  app.use(async (ctx) => {
    await requestHandler(ctx.req, ctx.res);
  });
  app.listen(globalConfig.wwwPort);
})();
