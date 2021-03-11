import { AppServer, listenOnPort } from "../../lib/src/appServer";
import { getRouteKeyFromCtx, globalConfig } from "../../lib/src/utils";
import Koa from "koa";
import proxy from "koa-better-http-proxy";

export const startSidecar = async (
  port: number,
  appSecret: string,
  prodUrl: string,
  routerUrl: string
): Promise<AppServer> => {
  const app = new Koa();

  app.use(
    proxy(prodUrl, {
      filter: (ctx) => {
        return !getRouteKeyFromCtx(ctx);
      },
    })
  );

  app.use(
    proxy(routerUrl, {
      filter: (ctx) => {
        return getRouteKeyFromCtx(ctx) != null;
      },
      proxyReqOptDecorator: (opts, ctx) => {
        opts.headers[globalConfig.appSecretHeader] = appSecret;
        opts.headers[globalConfig.routeKeyHeader] = getRouteKeyFromCtx(ctx);
        opts.headers[globalConfig.originalHostHeader] = ctx.host;
        return opts;
      },
    })
  );
  const server = await listenOnPort(app, port);
  return new AppServer(server);
};
