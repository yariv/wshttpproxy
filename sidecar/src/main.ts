import Koa from "koa";
import httpProxy from "node-http-proxy";

const app = new Koa();
var proxy = httpProxy.createProxyServer({});

const log = console.log;

const config = {
  authHeaderName: "dev-in-prod",
  localServiceUrl: "http://127.0.0.1:3000",
  routerUrl: "http://127.0.0.1:3002",
};

app.use(async (ctx) => {
  const authHeader = ctx.request.header[config.authHeaderName];
  let proxyTargetUrl;
  if (authHeader) {
    // todo check auth header
    proxyTargetUrl = config.routerUrl;
  } else {
    proxyTargetUrl = config.localServiceUrl;
  }
  proxy.web(ctx.req, ctx.res, { target: proxyTargetUrl });
});

app.listen(3001);
