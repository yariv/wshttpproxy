import Koa from "koa";

const app = new Koa();

app.use(async (ctx) => {
  //console.log(ctx.req);
  ctx.body = "Hello World";
});

app.listen(3000);
