import { WsWrapper } from "dev-in-prod-lib/src/typedWs";
import {
  genNewToken,
  getRouteKeyFromCtx,
  globalConfig,
} from "dev-in-prod-lib/src/utils";
import { clientSchema, serverSchema } from "dev-in-prod-lib/src/wsSchema";
import Koa from "koa";
import { prisma } from "./prisma";
import { getWebSocketKey, sha256, WsKey } from "./utils";
import WebSocket from "ws";
import { log } from "dev-in-prod-lib/src/log";
import getRawBody from "raw-body";

export class SocketManager {
  proxyRequests: Record<
    string,
    { timeoutId: NodeJS.Timeout; ctx: Koa.Context; resolve: () => void }
  > = {};

  allWebSockets: Set<WebSocket> = new Set();
  connectedWebSockets: Record<
    WsKey,
    WsWrapper<typeof clientSchema, typeof serverSchema>
  > = {};

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
      ctx.throw(400, "Invalid application secret");
    }

    const route = await prisma.route.findUnique({
      where: {
        applicationId_key: { applicationId: application.id, key: routeKey },
      },
    });
    if (!route) {
      ctx.throw(400, "Invalid route key");
    }

    console.log(
      "SDFSD",
      appSecret,
      routeKey,
      Object.keys(this.connectedWebSockets)
    );
    const webSocketKey = getWebSocketKey(application.id, routeKey);
    const wsWrapper = this.connectedWebSockets[
      "ckl9uvyb10002wcm7vl90hrki_lxQX66"
    ];
    //this.connectedWebSockets[webSocketKey];
    console.log(webSocketKey, wsWrapper, Object.keys(this.connectedWebSockets));
    if (!wsWrapper) {
      ctx.throw(400, "Route isn't connected");
    }

    const requestId = genNewToken();

    delete ctx.headers[globalConfig.appSecretHeader];
    delete ctx.headers[globalConfig.routeKeyHeader];

    // TODO deal with non utf-8 blobs
    const body = await getRawBody(ctx.req, { encoding: "utf-8" });

    wsWrapper.sendMsg("proxy", {
      requestId: requestId,
      method: ctx.method,
      headers: ctx.headers,
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
    wrapper.setHandler(
      "connect",
      async ({ oauthToken, applicationSecret, routeKey }) => {
        const sendErrMsg = (message: string) => {
          wrapper.sendMsg("connectionError", { message });
          wrapper.ws.close();
        };
        const token = await prisma.oAuthToken.findUnique({
          where: { tokenHash: sha256(oauthToken) },
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

        wrapper.sendMsg("connected");
      }
    );

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
