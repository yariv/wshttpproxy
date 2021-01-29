import {
  Closeable,
  start as appServerStart,
} from "dev-in-prod-lib/src/appServer";
import { log } from "dev-in-prod-lib/src/log";
import { getRouteKeyFromCtx, globalConfig } from "dev-in-prod-lib/src/utils";
import Koa from "koa";
import route from "koa-route";
import websockify from "koa-websocket";
import next from "next";
import * as ws from "ws";
import * as z from "zod";
import { prisma } from "./prisma";
import { router as apiRouter } from "./apiHandlers/router";
import { sha256 } from "./utils";

export const start = async (
  port: number,
  dirname: string
): Promise<Closeable> => {
  return await appServerStart(port, dirname, next, initKoaApp);
};

const originalHostHeader = "X-Forwarded-Host";

const liveWebSockets: Record<string, ws> = {};

const initKoaApp = async (): Promise<Koa> => {
  const koa = new Koa();

  koa.use(proxyMiddleware);

  koa.use(apiRouter.allowedMethods());
  koa.use(apiRouter.routes());

  // TODO use https
  const app = websockify(koa);
  app.ws.use(
    route.all("/ws", (ctx) => {
      const sendMsg = (msg: z.infer<typeof serverSchema>) => {
        ctx.websocket.send(JSON.stringify(msg));
      };
      ctx.websocket.on("open", () => {
        log("open");
      });
      ctx.websocket.on("message", (message) => {
        log("message", message);

        const parseResult = clientSchema.safeParse(message);
        if (parseResult.success) {
          switch (parseResult.data.type) {
            case "authorize":
              prisma.oAuthToken
                .findUnique({
                  where: { tokenHash: sha256(parseResult.data.authToken) },
                })
                .then((result) => {
                  if (result) {
                    liveWebSockets[result.tokenHash] = ctx.websocket;
                    ctx.websocket.on("close", () => {
                      log("close2", result.tokenHash);
                      delete liveWebSockets[result.tokenHash];
                    });
                    sendMsg({ type: "authorized" });
                  } else {
                    sendMsg({ type: "unauthorized" });
                  }
                });
          }
        } else {
          sendMsg({ type: "invalidMessage", message: message });
        }
        // when the ws authenticates, map it to the route key
      });
      ctx.websocket.on("close", () => {
        log("close");
      });
      ctx.websocket.on("error", () => {
        log("error");
      });
    })
  );
  return app;
};

const proxyMiddleware = async (ctx: Koa.Context, next: Koa.Next) => {
  const appSecret = ctx.header[globalConfig.appSecretHeader];
  if (!appSecret) {
    return next();
  }
  const originalHost = ctx.header[originalHostHeader];

  if (!originalHost) {
    ctx.throw(400, `Missing ${originalHostHeader} header`);
  }

  const routeKey = getRouteKeyFromCtx(ctx, originalHost);
  if (!routeKey) {
    ctx.throw(400, "Missing route key");
  }

  const application = await prisma.application.findUnique({
    where: { secret: appSecret },
  });
  if (!application) {
    ctx.throw(400, "Invalid application secret.");
  }
  const route = await prisma.route.findUnique({
    where: {
      applicationId_key: { applicationId: application.id, key: routeKey },
    },
  });
  if (!route) {
    ctx.throw(400, "Invalid route key");
  }

  if (!(routeKey in liveWebSockets)) {
    ctx.throw(400, "Route isn't connected");
  }

  const message: z.infer<typeof serverSchema> = {
    type: "proxy",
    method: ctx.method,
    headers: ctx.headers,
    body: ctx.body,
  };
  liveWebSockets[routeKey].send(JSON.stringify(message));
  ctx.status = 200;
};

const clientSchema = z.object({
  type: z.literal("authorize"),
  authToken: z.string(),
});

const serverSchema = z.union([
  z.object({
    type: z.literal("authorized"),
  }),
  z.object({
    type: z.literal("unauthorized"),
  }),
  z.object({
    type: z.literal("proxy"),
    method: z.string(),
    headers: z.record(z.string()),
    body: z.string(),
  }),
  z.object({
    type: z.literal("invalidMessage"),
    message: z.any(),
  }),
]);
