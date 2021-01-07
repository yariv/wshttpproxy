import Koa from "koa";
import next from "next";
import path from "path";

import { initDb } from "./db";
import route from "koa-route";
import websockify from "koa-websocket";
import { log } from "../../shared/src/log";

export const start = async (port: number): Promise<any> => {
  const dev = process.env.NODE_ENV !== "production";
  const nextConf = require("../next.config.js");
  const parentDir = path.resolve(__dirname, "..");
  const nextApp = next({ dev, conf: nextConf, dir: parentDir });

  await nextApp.prepare();
  const requestHandler = nextApp.getRequestHandler();

  const app = await createApp();
  app.use(async (ctx) => {
    await requestHandler(ctx.req, ctx.res);
  });
  const server = app.listen(port);
  return server;
};

const createApp = async (): Koa => {
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

// import Koa from "koa";
// import next from "next";

// import { globalConfig } from "../../shared/src/globalConfig";

// const dev = process.env.NODE_ENV !== "production";
// const nextConf = require("../next.config.js");
// const nextApp = next({ dev, conf: nextConf });

// export const main = async () => {
//   await nextApp.prepare();
//   const requestHandler = nextApp.getRequestHandler();
//   await initDb();

//   app.ws.use(
//     route.all("/ws", (ctx) => {
//       ctx.websocket.send("hi");
//       ctx.websocket.on("message", (message) => {
//         log(message);
//         ctx.websocket.send("sup");
//       });
//     })
//   );
//   app.use(async (ctx) => {
//     await requestHandler(ctx.req, ctx.res);
//   });
//   app.listen(globalConfig.wwwPort);
// };
