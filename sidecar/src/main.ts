import Koa from "koa";
import httpProxy from "http-proxy";

const app = new Koa();
var proxy = httpProxy.createProxyServer({});

const log = console.log;

const config = {
  authHeaderName: "dev-in-prod",
  localServiceUrl: "http://127.0.0.1:3000",
  routerUrl: "http://127.0.0.1:3002",
  authRedirectParam: "dev-in-prod",
};

app.use(async (ctx) => {
  const authHeader = ctx.request.header[config.authHeaderName];
  const authRedirectParam = ctx.request.query[config.authRedirectParam];
  let authToken = authHeader || authRedirectParam;
  // todo check auth token
  if (authToken) {
    proxy.web(ctx.req, ctx.res, { target: config.routerUrl });
    return;
  }

  proxyTargetUrl = config.localServiceUrl;
});

app.listen(3001);
