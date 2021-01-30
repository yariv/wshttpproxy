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
import { clientSchema, serverSchema } from "dev-in-prod-lib/src/wsSchema";
import { ZodError } from "zod";

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
      initWebsocket(ctx.websocket, serverSchema, clientSchema);
    })
  );
  return app;
};

type WsSchema = Record<string, z.ZodType<any>>;

const initWebsocket = (
  ws: ws,
  incomingSchema: WsSchema,
  outgoingSchema: WsSchema,
  handler: (
    ws: ws,
    sendMsg: (
      outgoingMsgType: keyof typeof outgoingSchema,
      body: z.infer<typeof outgoingSchema[typeof outgoingMsgType]>
    ) => void,
    msgType: keyof typeof incomingSchema,
    body: z.infer<typeof incomingSchema[typeof msgType]>
  ) => Promise<void>
) => {
  const sendMsg = (
    type: keyof typeof outgoingSchema,
    body: z.infer<typeof outgoingSchema[typeof type]>
  ) => {
    ws.send(JSON.stringify({ type, body }));
  };

  ws.onopen = () => {
    log("open");
  };

  ws.onmessage = (message) => {
    log("message", message);
    const msgStr = message.data.toString("utf-8");
    let unserialized;
    try {
      unserialized = JSON.parse(msgStr);
    } catch (e) {
      log("Invalid message", msgStr);
      return;
    }

    const msgType = unserialized.type;
    if (!msgType || !(msgType in incomingSchema)) {
      log("Invalid message", msgStr);
      return;
    }

    const parseResult = incomingSchema[msgType].safeParse(unserialized);
    if (parseResult.success) {
      handler(ws, sendMsg, msgType, parseResult.data).catch((err) => {
        log("Error in handling message", message, err.message);
      });
    } else {
      log("Invalid message", message);
    }
    // when the ws authenticates, map it to the route key
  };

  ws.onclose = () => {
    console.log("close");
  };
  ws.onerror = (err) => {
    console.error("error");
  };
};

type HandlerType<
  IncomingSchemaType extends WsSchema,
  OutgoingSchemaType extends WsSchema
> = (
  ws: ws,
  sendMsg: (
    outgoingMsgType: keyof OutgoingSchemaType,
    body: z.infer<OutgoingSchemaType[typeof outgoingMsgType]>
  ) => void,
  msgType: keyof IncomingSchemaType,
  body: z.infer<IncomingSchemaType[typeof msgType]>
) => Promise<void>;

const handler: HandlerType<typeof clientSchema, typeof serverSchema> = async (
  ws,
  sendMsg,
  msgType,
  body
) => {
  switch (msgType) {
    case "authorize":
      prisma.oAuthToken
        .findUnique({
          where: { tokenHash: sha256(body.authToken) },
        })
        .then((result) => {
          if (result) {
            liveWebSockets[result.tokenHash] = ws;
            ws.on("close", () => {
              log("close2", result.tokenHash);
              delete liveWebSockets[result.tokenHash];
            });
          } else {
            sendMsg("unauthorized");
          }
        });
  }
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
