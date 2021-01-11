import Koa from "koa";

import proxy from "koa-better-http-proxy";
import { config } from "./config";
import { Closeable } from "dev-in-prod-lib/src/appServer";

import util from "util";

export const start = (port: number): Closeable => {
  const app = new Koa();
  app.use(
    proxy(config.prodServiceUrl, {
      filter: (ctx) => {
        return isProdRequest(ctx);
      },
    })
  );
  app.use(
    proxy(config.devProxyUrl, {
      filter: (ctx) => {
        return !isProdRequest(ctx);
      },
    })
  );

  const isProdRequest = (ctx: Koa.Context): boolean => {
    const tokens = ctx.host.split(".");
    return tokens.length > 2 && tokens[tokens.length - 3] == "devinprod";
  };

  const server = app.listen(port);

  const closeableServer = {
    close: util.promisify(server.close),
  };

  return closeableServer;
};
