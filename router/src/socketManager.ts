import { WsWrapper } from "dev-in-prod-lib/src/typedWs";
import {
  genNewToken,
  getRouteKeyFromCtx,
  globalConfig,
} from "dev-in-prod-lib/src/utils";
import { clientSchema2, serverSchema2 } from "dev-in-prod-lib/src/wsSchema";
import Koa from "koa";
import { prisma } from "./prisma";
import { getWebSocketKey, sha256, WsKey } from "./utils";
import WebSocket from "ws";
import { log } from "dev-in-prod-lib/src/log";

export class SocketManager {
  proxyRequests: Record<
    string,
    { timeoutId: NodeJS.Timeout; ctx: Koa.Context; resolve: () => void }
  > = {};

  allWebSockets: Set<WebSocket> = new Set();
  connectedWebSockets: Record<
    WsKey,
    WsWrapper<typeof clientSchema2, typeof serverSchema2>
  > = {};

  close() {
    this.allWebSockets.forEach((ws) => {
      ws.close();
    });
    for (const [key, { timeoutId, ctx }] of Object.entries(
      this.proxyRequests
    )) {
      clearTimeout(timeoutId);
      // TODO is this needed?
      ctx.res.end();
    }
  }

  async proxyMiddleware(ctx: Koa.Context, next: Koa.Next): Promise<void> {
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
    if (!this.connectedWebSockets[webSocketKey]) {
      ctx.throw(400, "Route isn't connected");
    }

    const requestId = genNewToken();

    this.connectedWebSockets[webSocketKey].sendMsg("proxy", {
      requestId: requestId,
      method: ctx.method,
      headers: ctx.headers,
      body: ctx.request.rawBody,
      path: ctx.path,
    });

    const timeoutId = setTimeout(() => {
      this.sendProxyResponse(requestId, (ctx) => {
        ctx.status = 500;
        ctx.body = "Request timed out";
      });
    }, globalConfig.proxyTimeout) as any;

    const promise = new Promise<void>((resolve) => {
      this.proxyRequests[requestId] = { timeoutId, ctx, resolve };
    });

    return promise;
  }

  sendProxyResponse(requestId: string, handler: (ctx: Koa.Context) => void) {
    if (!(requestId in this.proxyRequests)) {
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
        if (this.connectedWebSockets[webSocketKey]) {
          console.log("Closing existing websocket with key", webSocketKey);
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
      }
    );

    wrapper.setHandler("proxyError", async ({ requestId, message }) => {
      this.sendProxyResponse(requestId, (ctx) => {
        ctx.status = 500;
        ctx.body = message;
      });
    });

    wrapper.setHandler(
      "proxyResult",
      async ({ body, requestId, status, statusText }) => {
        this.sendProxyResponse(requestId, (ctx) => {
          ctx.status = 500;
          ctx.body = body;
          ctx.status = status;
          ctx.statusText = statusText;
        });
      }
    );
    return wrapper;
  }
}
