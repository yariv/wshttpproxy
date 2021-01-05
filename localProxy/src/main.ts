import Koa from "koa";
import next from "next";
import storage from "node-persist";

import { log } from "../../shared/src/log";

const app = new Koa();
const dev = process.env.NODE_ENV !== "production";
const nextConf = require("../next.config.js");
const nextApp = next({ dev, conf: nextConf });

// We use this initialization logic to create a db connection.
(async () => {
  await storage.init();
  await nextApp.prepare();
  const requestHandler = nextApp.getRequestHandler();

  app.use(async (ctx) => {
    await requestHandler(ctx.req, ctx.res);
  });
  app.listen(3001);
})();
