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
} from "dev-in-prod-lib/src/typedWs";
import {
  genNewToken,
  getRouteKeyFromCtx,
  globalConfig,
} from "dev-in-prod-lib/src/utils";
import {
  clientSchema,
  clientSchema2,
  serverSchema,
  serverSchema2,
} from "dev-in-prod-lib/src/wsSchema";
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
      for (const ws of Object.values(allWebSockets)) {
        ws.close();
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

export const allWebSockets: Set<WebSocket> = new Set();

type WsKey = string;
const connectedWebSockets: Record<
  WsKey,
  WsWrapper<typeof clientSchema2, typeof serverSchema2>
> = {};
const getWebSocketKey = (applicationId: string, routeKey: string): WsKey =>
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
      const wsWrapper = createWsWrapper(ctx.websocket);
      allWebSockets.add(wsWrapper.ws);
      wsWrapper.ws.on("close", () => {
        allWebSockets.delete(wsWrapper.ws);
      });
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

const createWsWrapper = (
  ws: WebSocket
): WsWrapper<typeof clientSchema2, typeof serverSchema2> => {
  const wrapper = new WsWrapper(ws, clientSchema2);
  wrapper.setHandler(
    "connect",
    async ({ authToken, applicationSecret, routeKey }) => {
      const sendErrMsg = (message: string) => {
        wrapper.sendMsg("connection_error", { message });
        wrapper.ws.close();
      };
      const token = await prisma.oAuthToken.findUnique({
        where: { tokenHash: sha256(authToken) },
      });
      if (!token) {
        sendErrMsg("Invalid oauth token");
        return;
      }
      // TODO use a different secret
      const application = await prisma.application.findUnique({
        where: { secret: applicationSecret },
      });
      if (!application) {
        sendErrMsg("Invalid application secret");
        return;
      }

      const route = await prisma.route.findUnique({
        where: {
          applicationId_key: {
            applicationId: application.id,
            key: routeKey,
          },
        },
      });
      if (!route) {
        sendErrMsg("Invalid route key");
        return;
      }

      const webSocketKey = getWebSocketKey(application.id, routeKey);
      if (connectedWebSockets[webSocketKey]) {
        console.log("Closing existing websocket with key", webSocketKey);
        // TODO make sure this doesn't remove the new ws
        connectedWebSockets[webSocketKey].ws.close();
      }
      connectedWebSockets[webSocketKey] = wrapper;
      wrapper.ws.on("close", () => {
        if (connectedWebSockets[webSocketKey] === wrapper) {
          log("deleting ws", webSocketKey);
          delete connectedWebSockets[webSocketKey];
        } else {
          log("keeping existing ws", webSocketKey);
        }
      });
    }
  );
  wrapper.setHandler("proxyError", async ({ requestId, message }) => {
    sendProxyResponse(requestId, (ctx) => {
      ctx.status = 500;
      ctx.body = message;
    });
  });

  wrapper.setHandler(
    "proxyResult",
    async ({ body, requestId, status, statusText }) => {
      sendProxyResponse(requestId, (ctx) => {
        ctx.status = 500;
        ctx.body = body;
        ctx.status = status;
        ctx.statusText = statusText;
      });
    }
  );
  return wrapper;
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
  if (!connectedWebSockets[webSocketKey]) {
    ctx.throw(400, "Route isn't connected");
  }

  const requestId = genNewToken();

  connectedWebSockets[webSocketKey].sendMsg("proxy", {
    requestId: requestId,
    method: ctx.method,
    headers: ctx.headers,
    body: ctx.request.rawBody,
    path: ctx.path,
  });

  const timeoutId = setTimeout(() => {
    sendProxyResponse(requestId, (ctx) => {
      ctx.status = 500;
      ctx.body = "Request timed out";
    });
  }, proxyTimeout) as any;

  proxyRequests[requestId] = { timeoutId, ctx };
};
