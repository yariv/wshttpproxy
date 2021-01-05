import Koa from "koa";

import proxy from "koa-better-http-proxy";
import { config } from "./config";
import { globalConfig } from "../../shared/src/globalConfig";

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

app.listen(globalConfig.sidecarPort);
