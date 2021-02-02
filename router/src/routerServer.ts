import {
  Closeable,
  CloseableContainer,
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
  const closeable = await appServerStart(port, dirname, next, initKoaApp());
  const closeable2 = {
    close: async () => {
      for (const wsWrapper of Object.values(liveWebSockets)) {
        wsWrapper.ws.close();
      }
      for (const [key, { timeoutId, ctx }] of Object.entries(proxyRequests)) {
        clearTimeout(timeoutId);
        // TODO is this needed?
        ctx.res.end();
      }
    },
  };
  return new CloseableContainer([closeable, closeable2]);
};

const proxyTimeout = 10000;

const liveWebSockets: Record<string, WsWrapper<typeof serverSchema>> = {};
const getWebSocketKey = (applicationId: string, routeKey: string) =>
  applicationId + "_" + routeKey;

const proxyRequests: Record<
  string,
  { timeoutId: NodeJS.Timeout; ctx: Koa.Context }
> = {};

const initKoaApp = (): Koa => {
  const koa = new Koa();
  koa.use((ctx, next) => {
    log(ctx.host, ctx.hostname, ctx.headers, ctx.path);
    return next();
  });
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
      case "connect":
        const sendErrMsg = (message: string) => {
          wsWrapper.sendMsg({
            type: "connection_error",
            params: { message },
          });
          wsWrapper.ws.close();
        };
        const token = await prisma.oAuthToken.findUnique({
          where: { tokenHash: sha256(msg.params.authToken) },
        });
        if (!token) {
          sendErrMsg("Invalid oauth token");
          return;
        }
        // TODO use a different secret
        const application = await prisma.application.findUnique({
          where: { secret: msg.params.applicationSecret },
        });
        if (!application) {
          sendErrMsg("Invalid application secret");
          return;
        }

        const routeKey = msg.params.routeKey;
        const route = await prisma.route.findUnique({
          where: {
            applicationId_key: { applicationId: application.id, key: routeKey },
          },
        });
        if (!route) {
          sendErrMsg("Invalid route key");
          return;
        }

        const webSocketKey = getWebSocketKey(application.id, routeKey);
        if (liveWebSockets[webSocketKey]) {
          console.log("Closing existing websocket with key", webSocketKey);
          // TODO make sure this doesn't remove the new ws
          liveWebSockets[webSocketKey].ws.close();
        }
        liveWebSockets[webSocketKey] = wsWrapper;
        wsWrapper.ws.on("close", () => {
          if (liveWebSockets[webSocketKey] === wsWrapper) {
            log("deleting ws", webSocketKey);
            delete liveWebSockets[webSocketKey];
          } else {
            log("keeping existing ws", webSocketKey);
          }
        });
        break;
      case "proxyError":
        sendProxyResponse(msg.params.requestId, (ctx) => {
          ctx.status = 500;
          ctx.body = msg.params.message;
        });
        break;
      case "proxyResult":
        sendProxyResponse(msg.params.requestId, (ctx) => {
          ctx.status = 500;
          ctx.body = msg.params.body;
          ctx.status = msg.params.status;
          ctx.statusText = msg.params.statusText;
          ctx.headers = msg.params.headers;
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
  const originalHost = ctx.header[globalConfig.originalHostHeader];

  if (!originalHost) {
    ctx.throw(400, `Missing ${globalConfig.originalHostHeader} header`);
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

  const webSocketKey = getWebSocketKey(application.id, routeKey);
  if (!liveWebSockets[webSocketKey]) {
    ctx.throw(400, "Route isn't connected");
  }

  const requestId = genNewToken();

  debugger;
  liveWebSockets[webSocketKey].sendMsg({
    type: "proxy",
    params: {
      requestId: requestId,
      method: ctx.method,
      headers: ctx.headers,
      body: ctx.request.rawBody,
      path: ctx.path,
    },
  });

  const timeoutId = setTimeout(() => {
    sendProxyResponse(requestId, (ctx) => {
      ctx.status = 500;
      ctx.body = "Request timed out";
    });
  }, proxyTimeout) as any;

  proxyRequests[requestId] = { timeoutId, ctx };
};
