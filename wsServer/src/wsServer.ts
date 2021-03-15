import { initWebsocket, WsWrapper } from "../../lib/src/typedWs";
import {
  genNewToken,
  getRouteKeyFromCtx,
  globalConfig,
} from "../../lib/src/utils";
import { clientSchema, serverSchema } from "../../lib/src/wsSchema";
import Koa from "koa";
import { prisma } from "./prisma";
import { getRouteKey, sha256, WsKey } from "./utils";
import WebSocket from "ws";
import { log } from "../../lib/src/log";
import getRawBody from "raw-body";
import { AppServer, listenOnPort } from "lib/src/appServer";

import logger from "koa-logger";
import route from "koa-route";
import websockify from "koa-websocket";
import { router as apiRouter } from "./api/router";

export const wsServerStart = async (
  port: number,
  routingSecret: string
): Promise<AppServer> => {
  const socketManager = new wsServer(routingSecret);
  const koa = initKoaApp(socketManager);
  const server = await listenOnPort(koa, port);
  const appServer = new AppServer(server);

  appServer.onClose(async () => {
    socketManager.close();
    const promises: Promise<void>[] = [prisma.$disconnect()];
    await Promise.all(promises);
  });

  return appServer;
};

const initKoaApp = (socketManager: wsServer): Koa => {
  const koa = new Koa();
  koa.use(logger());
  koa.use(socketManager.proxyMiddleware.bind(socketManager));
  koa.use(apiRouter.allowedMethods());
  koa.use(apiRouter.routes());

  const app = websockify(koa as any);
  app.ws.use(
    route.all("/ws", (ctx) => {
      initWebsocket(ctx.websocket);
      socketManager.registerWebSocket(ctx.websocket);
    })
  );
  return app as any;
};

export class wsServer {
  proxyRequests: Record<
    string,
    { timeoutId: NodeJS.Timeout; ctx: Koa.Context; resolve: () => void }
  > = {};

  allWebSockets: Set<WebSocket> = new Set();
  connectedWebSockets: Record<
    WsKey,
    WsWrapper<typeof clientSchema, typeof serverSchema>
  > = {};
  routingSecret: string;

  constructor(routingSecret: string) {
    this.routingSecret = routingSecret;
  }

  close() {
    this.allWebSockets.forEach((ws) => {
      ws.close();
    });
    for (const [key, { timeoutId, ctx }] of Object.entries(
      this.proxyRequests
    )) {
      clearTimeout(timeoutId);
      ctx.status = 500;
      ctx.body = "Proxy error";
      ctx.res.end();
    }
  }

  async proxyMiddleware(ctx: Koa.Context, next: Koa.Next): Promise<void> {
    const routingSecret = ctx.header[globalConfig.routingSecretHeader];
    if (!routingSecret) {
      return next();
    }
    if (!(routingSecret == this.routingSecret)) {
      ctx.throw(400, "Invalid application secret");
    }

    const originalHost = ctx.header[globalConfig.originalHostHeader];
    if (!originalHost) {
      ctx.throw(400, `Missing ${globalConfig.originalHostHeader} header`);
    }

    const routeKey = getRouteKeyFromCtx(ctx, originalHost);
    if (!routeKey) {
      ctx.throw(400, "Missing route key");
    }

    const wsWrapper = this.connectedWebSockets[routeKey];
    if (!wsWrapper) {
      ctx.throw(400, "Route isn't connected");
    }

    const requestId = genNewToken();

    delete ctx.headers[globalConfig.routingSecretHeader];
    delete ctx.headers[globalConfig.routeKeyHeader];

    // TODO deal with non utf-8 blobs
    const body = await getRawBody(ctx.req, { encoding: "utf-8" });

    wsWrapper.sendMsg("proxy", {
      requestId: requestId,
      method: ctx.method,
      headers: ctx.headers as Record<string, string>, // TODO remove casting
      body: body,
      path: ctx.path,
    });

    const timeoutId = setTimeout(() => {
      this.sendProxyResponse(wsWrapper, requestId, (ctx) => {
        ctx.status = 500;
        ctx.body = "Request timed out";
      });
    }, globalConfig.proxyTimeout) as any;

    const promise = new Promise<void>((resolve) => {
      this.proxyRequests[requestId] = { timeoutId, ctx, resolve };
    });

    return promise;
  }

  sendProxyResponse(
    wsWrapper: WsWrapper<typeof clientSchema, typeof serverSchema>,
    requestId: string,
    handler: (ctx: Koa.Context) => void
  ) {
    if (!(requestId in this.proxyRequests)) {
      wsWrapper.sendMsg("invalidRequestId", { requestId });
      return;
    }
    const { ctx, timeoutId, resolve } = this.proxyRequests[requestId];
    handler(ctx);
    clearTimeout(timeoutId);
    resolve();
    delete this.proxyRequests[requestId];
  }

  registerWebSocket(ws: WebSocket) {
    this.allWebSockets.add(ws);
    ws.on("close", () => {
      this.allWebSockets.delete(ws);
    });

    const wrapper = new WsWrapper(ws, clientSchema, serverSchema);
    wrapper.setHandler("connect", async ({ authToken }) => {
      const sendErrMsg = (message: string) => {
        wrapper.sendMsg("connectionError", { message });
        wrapper.ws.close();
      };
      const token = await prisma.authToken.findUnique({
        where: { tokenHash: sha256(authToken) },
      });
      if (!token) {
        sendErrMsg("Invalid oauth token");
        return;
      }

      const webSocketKey = getRouteKey(authToken);
      if (this.connectedWebSockets[webSocketKey]) {
        // TODO make sure this doesn't remove the new ws
        this.connectedWebSockets[webSocketKey].ws.close();
      }
      this.connectedWebSockets[webSocketKey] = wrapper;
      wrapper.ws.on("close", () => {
        if (this.connectedWebSockets[webSocketKey] === wrapper) {
          delete this.connectedWebSockets[webSocketKey];
        } else {
          log("keeping existing ws", webSocketKey);
        }
      });

      wrapper.sendMsg("connected");
    });

    wrapper.setHandler("proxyError", async ({ requestId, message }) => {
      this.sendProxyResponse(wrapper, requestId, (ctx) => {
        ctx.status = 500;
        ctx.body = message;
      });
    });

    wrapper.setHandler(
      "proxyResult",
      async ({ body, requestId, status, headers }) => {
        this.sendProxyResponse(wrapper, requestId, (ctx) => {
          ctx.body = body;
          ctx.status = status;
          for (const [header, val] of Object.entries(headers)) {
            ctx.set(header, val);
          }
        });
      }
    );
    return wrapper;
  }
}
