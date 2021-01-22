import Koa from "koa";

import proxy from "koa-better-http-proxy";
import { config } from "./config";
import { Closeable, listenOnPort } from "dev-in-prod-lib/src/appServer";

import { globalConfig } from "dev-in-prod-lib/src/globalConfig";

export const start = async (port: number): Promise<Closeable> => {
  const app = new Koa();
  const sidecarHeaders = {
    [globalConfig.sidecarProxyHeader]: "true",
  };

  app.use(
    proxy(config.prodServiceUrl, {
      filter: (ctx) => {
        return !isDevRequest(ctx);
      },
      headers: sidecarHeaders,
    })
  );

  app.use(
    proxy(config.routerUrl, {
      filter: (ctx) => {
        return isDevRequest(ctx);
      },
      headers: sidecarHeaders,
    })
  );

  const isDevRequest = (ctx: Koa.Context): boolean => {
    const tokens = ctx.host.split(".");
    return (
      (tokens.length > 2 && tokens[tokens.length - 3] == "devinprod") ||
      ctx.header[globalConfig.devInProdHeader] == "true"
    );
  };

  return listenOnPort(app, port);
};
