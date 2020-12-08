import Koa from "koa";
import next from "next";

import { initDb } from "./db";
import { genNewToken } from "./utils";

for (let i = 0; i < 100; i++) {
  console.log(genNewToken());
}

const dev = process.env.NODE_ENV !== "production";
const nextConf = require("../next.config.js");
const nextApp = next({ dev, conf: nextConf });
const app = new Koa();

// We use this initialization logic to create a db connection.
(async () => {
  await nextApp.prepare();
  const requestHandler = nextApp.getRequestHandler();
  await initDb();

  app.use(async (ctx) => {
    await requestHandler(ctx.req, ctx.res);
  });
  app.listen(3000);
})();
