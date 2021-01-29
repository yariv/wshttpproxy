import Koa from "koa";

import proxy from "koa-better-http-proxy";
import { config } from "./config";
import { Closeable, listenOnPort } from "dev-in-prod-lib/src/appServer";

import {
  getRouteKeyFromHostname,
  globalConfig,
} from "dev-in-prod-lib/src/utils";

export const startSidecar = async (
  port: number,
  appSecret: string
): Promise<Closeable> => {
  const app = new Koa();

  app.use(
    proxy(config.prodServiceUrl, {
      filter: (ctx) => {
        return !getRouteKey(ctx);
      },
    })
  );

  app.use(
    proxy(config.routerUrl, {
      // TODO remove?
      filter: (ctx) => {
        return getRouteKey(ctx) != null;
      },
      proxyReqOptDecorator: (opts, ctx) => {
        opts.headers[globalConfig.appSecretHeader] = appSecret;
        opts.headers[globalConfig.routeKeyHeader] = getRouteKey(ctx);
        return opts;
      },
    })
  );
  return listenOnPort(app, port);
};

const getRouteKey = (ctx: Koa.Context): string => {
  return (
    ctx.headers[globalConfig.routeKeyHeader] ||
    getRouteKeyFromHostname(ctx.hostname)
  );
};
