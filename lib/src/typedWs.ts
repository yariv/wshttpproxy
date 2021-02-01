import * as z from "zod";
import WebSocket from "ws";
import { log } from "./log";

export type WsMsg =
  | z.ZodObject<{
      type: z.ZodLiteral<string>;
      body: z.ZodObject<any>;
    }>
  | z.ZodObject<{ type: z.ZodLiteral<string> }>;
export type WsSchema = WsMsg | z.ZodUnion<[WsMsg, WsMsg, ...WsMsg[]]>;
export type WsHandlerType<IncomingSchemaType extends WsSchema> = (
  msg: z.infer<IncomingSchemaType>
) => Promise<void>;

export class WsWrapper<OutgoingSchemaType extends WsSchema> {
  ws: WebSocket;
  constructor(ws: WebSocket) {
    this.ws = ws;
  }

  sendMsg(msg: z.infer<OutgoingSchemaType>) {
    this.ws.send(JSON.stringify(msg));
  }
}

export const getMsgHandler = <IncomingSchemaType extends WsSchema>(
  incomingSchema: IncomingSchemaType,
  handler: (message: z.infer<IncomingSchemaType>) => Promise<void>
): ((event: WebSocket.MessageEvent) => void) => {
  return (event) => {
    log("message", event);
    const msgStr = event.data.toString("utf-8");
    let unserialized;
    try {
      unserialized = JSON.parse(msgStr);
    } catch (e) {
      log("Error parsing", msgStr);
      // TODO close?
      return;
    }

    const parseResult = incomingSchema.safeParse(unserialized);
    if (parseResult.success) {
      handler(parseResult.data).catch((err) => {
        log("Error in handling message", event, err.message);
        // TODO close?
      });
    } else {
      log("Invalid message", event, parseResult);
      // TODO close?
    }
  };
};
export const initWebsocket = (ws: WebSocket) => {
  ws.onopen = () => {
    log("open");
  };

  ws.onclose = () => {
    console.log("close");
  };
  ws.onerror = (err) => {
    console.error("error");
  };
};
