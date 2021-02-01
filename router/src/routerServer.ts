import {
  Closeable,
  start as appServerStart,
} from "dev-in-prod-lib/src/appServer";
import { log } from "dev-in-prod-lib/src/log";
import {
  WsHandlerType,
  initWebsocket,
  WsWrapper,
  getMsgHandler,
} from "dev-in-prod-lib/src/typedWs";
import {
  genNewToken,
  getRouteKeyFromCtx,
  globalConfig,
} from "dev-in-prod-lib/src/utils";
import { clientSchema, serverSchema } from "dev-in-prod-lib/src/wsSchema";
import Koa from "koa";
import route from "koa-route";
import websockify from "koa-websocket";
import next from "next";
import { router as apiRouter } from "./apiHandlers/router";
import { prisma } from "./prisma";
import { sha256 } from "./utils";
import WebSocket from "ws";

export const start = async (
  port: number,
  dirname: string
): Promise<Closeable> => {
  return await appServerStart(port, dirname, next, initKoaApp);
};

const originalHostHeader = "X-Forwarded-Host";

const proxyTimeout = 10000;

const liveWebSockets: Record<string, WsWrapper<typeof serverSchema>> = {};
const proxyRequests: Record<
  string,
  { timeoutId: number; ctx: Koa.Context }
> = {};

const initKoaApp = async (): Promise<Koa> => {
  const koa = new Koa();

  koa.use(proxyMiddleware);

  koa.use(apiRouter.allowedMethods());
  koa.use(apiRouter.routes());

  // TODO use https
  const app = websockify(koa);
  app.ws.use(
    route.all("/ws", (ctx) => {
      initWebsocket(ctx.websocket);
      ctx.websocket.onmessage = getMsgHandler(
        clientSchema,
        makeWsServerHandler(ctx.websocket)
      );
    })
  );
  return app;
};

const sendProxyResponse = (
  requestId: string,
  handler: (ctx: Koa.Context) => void
) => {
  if (!(requestId in proxyRequests)) {
    return;
  }
  handler(proxyRequests[requestId].ctx);
  clearTimeout(proxyRequests[requestId].timeoutId);
  delete proxyRequests[requestId];
};

const makeWsServerHandler = (
  ws: WebSocket
): WsHandlerType<typeof clientSchema> => {
  const wsWrapper = new WsWrapper<typeof serverSchema>(ws);
  return async (msg) => {
    console.log("got message", msg);
    switch (msg.type) {
      case "authorize":
        const result = await prisma.oAuthToken.findUnique({
          where: { tokenHash: sha256(msg.body.authToken) },
        });
        if (result) {
          liveWebSockets[result.tokenHash] = wsWrapper;
          wsWrapper.ws.on("close", () => {
            log("close2", result.tokenHash);
            delete liveWebSockets[result.tokenHash];
          });
        } else {
          wsWrapper.sendMsg({ type: "unauthorized" });
          wsWrapper.ws.close();
        }
        break;
      case "proxyError":
        sendProxyResponse(msg.body.requestId, (ctx) => {
          ctx.status = 500;
          ctx.body = msg.body.message;
        });
        break;
      case "proxyResult":
        sendProxyResponse(msg.body.requestId, (ctx) => {
          ctx.status = 500;
          ctx.body = msg.body.body;
        });
        break;
    }
  };
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
  const requestId = genNewToken();

  liveWebSockets[routeKey].sendMsg({
    type: "proxy",
    body: {
      requestId: requestId,
      method: ctx.method,
      headers: ctx.headers,
      body: ctx.body,
    },
  });

  const timeoutId = setTimeout(() => {
    sendProxyResponse(requestId, (ctx) => {
      ctx.status = 500;
      ctx.body = "Request timed out";
    });
  }, proxyTimeout);
  proxyRequests[requestId] = { timeoutId, ctx };
};
