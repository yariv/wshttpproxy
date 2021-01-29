import { Closeable, listenOnPort } from "dev-in-prod-lib/src/appServer";
import { getRouteKeyFromCtx, globalConfig } from "dev-in-prod-lib/src/utils";
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
      // TODO remove?
      filter: (ctx) => {
        return getRouteKeyFromCtx(ctx) != null;
      },
      proxyReqOptDecorator: (opts, ctx) => {
        opts.headers[globalConfig.appSecretHeader] = appSecret;
        opts.headers[globalConfig.routeKeyHeader] = getRouteKeyFromCtx(ctx);
        return opts;
      },
    })
  );
  return listenOnPort(app, port);
};
