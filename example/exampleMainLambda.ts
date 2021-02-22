import Koa from "koa";
import Router from "koa-router";
import serverless from "serverless-http";

const app = new Koa();
const router = new Router();
router.get("/", async (ctx) => {
  ctx.body = "hi";
});

app.use(router.routes()).use(router.allowedMethods);
module.exports.handler = serverless(app);
