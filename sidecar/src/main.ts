import Koa from "koa";
import httpProxy from "http-proxy";

const app = new Koa();
var proxy = httpProxy.createProxyServer({});

const log = console.log;

const config = {
  authCookieName: "dev-in-prod",
  sidecarUrl: "http://127.0.0.1:3000",
  routerUrl: "http://127.0.0.1:3002",
  authRedirectParam: "dev-in-prod",
};

app.use(async (ctx) => {
  let authToken = ctx.request.query[config.authRedirectParam];
  if (authToken) {
    ctx.cookies.set(config.authCookieName, authToken);
  } else {
    authToken = ctx.cookies.get(config.authCookieName);
  }

  // If the request contains an auth token, proxy the request to
  // the router.
  const proxyTarget = authToken ? config.routerUrl : config.sidecarUrl;
  proxy.web(ctx.req, ctx.res, { target: proxyTarget });
});

app.listen(3001);
