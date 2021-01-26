import Router from "koa-router";

export const router = new Router();
router.all("/api2/createApplication", async (ctx) => {
  ctx.body = "foo";
});
