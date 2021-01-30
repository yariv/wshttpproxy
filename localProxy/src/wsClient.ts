import {
  clientSchema,
  ServerMsg,
  serverSchema,
} from "dev-in-prod-lib/src/wsSchema";
import {
  HandlerType,
  initWebsocket,
  WsSchema,
} from "dev-in-prod-lib/src/typedWs";
import { globalConfig } from "../../lib/src/utils";
import WebSocket from "ws";
import * as z from "zod";

type Handler<
  IncomingSchemaType extends WsSchema,
  MsgType extends keyof IncomingSchemaType,
  BodyType extends z.infer<IncomingSchemaType[MsgType]> = z.infer<
    IncomingSchemaType[MsgType]
  >
> = (msgType: MsgType, bodyType: BodyType) => {};

const foo: Handler<typeof serverSchema, "proxy"> = (msgType, bodyType) => {
  msgType == "proxy";
  bodyType.body;
};

const handler: HandlerType<typeof serverSchema, typeof clientSchema> = async (
  wsWrapper,
  msgType,
  body
) => {
  switch (msgType) {
    case "proxy":
      const res = await fetch(globalConfig.exampleDevUrl, {
        headers: body("proxy").headers,
        method: body.method,
        body: body.body,
      });
      break;
    case "unauthorized":
      break;
  }
};

export const initWsClient = (token: string) => {
  const ws = new WebSocket(globalConfig.routerWsUrl);
  initWebsocket(ws, serverSchema, handler);
};
