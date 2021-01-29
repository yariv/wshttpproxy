import {
  Closeable,
  start as appServerStart,
} from "dev-in-prod-lib/src/appServer";
import { globalConfig } from "dev-in-prod-lib/src/globalConfig";
import Koa from "koa";
import route from "koa-route";
import websockify from "koa-websocket";
import next from "next";
import { log } from "../../lib/src/log";
import { prisma } from "./prisma";
import { router as apiRouter } from "./routes/api";

export const start = async (
  port: number,
  dirname: string
): Promise<Closeable> => {
  return await appServerStart(port, dirname, next, initKoaApp);
};

const originalHostHeader = "X-Forwarded-Host";

const initKoaApp = async (): Promise<Koa> => {
  const koa = new Koa();

  koa.use(async (ctx, next) => {
    const appSecret = ctx.header[globalConfig.appSecretHeader];
    if (!appSecret) {
      return next();
    }
    const originalHost = ctx.header[originalHostHeader];

    if (!originalHost) {
      ctx.status = 400;
      ctx.body = `Missing ${originalHostHeader} header`;
      return;
    }

    const application = await prisma.application.findUnique({
      where: { secret: appSecret },
    });
    if (!application) {
      ctx.status = 400;
      ctx.body = "Invalid application secret.";
    } else {
      await prisma.route.findUnique({
        where: {
        applicationId_key: { applicationId: application.id,
        key: routeKey },

      },
    });
  });

  koa.use(apiRouter.allowedMethods());
  koa.use(apiRouter.routes());

  const app = websockify(koa);
  app.ws.use(
    route.all("/ws", (ctx) => {
      ctx.websocket.send("hi");
      ctx.websocket.on("message", (message) => {
        log(message);
        ctx.websocket.send("sup");
      });
    })
  );
  return app;
};
