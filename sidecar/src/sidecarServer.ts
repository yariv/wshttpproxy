import { Closeable, listenOnPort } from "dev-in-prod-lib/src/appServer";
import { getRouteKeyFromCtx, globalConfig } from "dev-in-prod-lib/src/utils";
import { log } from "dev-in-prod-lib/src/log";
import Koa from "koa";
import proxy from "koa-better-http-proxy";
import { config } from "./config";

export const startSidecar = async (
  port: number,
  appSecret: string
): Promise<Closeable> => {
  const app = new Koa();

  app.use(
    proxy(config.prodServiceUrl, {
      filter: (ctx) => {
        return !getRouteKeyFromCtx(ctx);
      },
    })
  );

  app.use(
    proxy(config.routerUrl, {
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
  return listenOnPort(app, port);
};