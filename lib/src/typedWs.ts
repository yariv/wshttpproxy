import WebSocket from "ws";
import * as z from "zod";
import { log } from "./log";

export type WsSchema = Record<string, z.ZodType<any>>;

export type WsHandlerType<IncomingSchemaType extends WsSchema> = (
  msgType: keyof IncomingSchemaType,
  msg: z.infer<IncomingSchemaType[typeof msgType]>
) => Promise<void>;

const genericMsgSchema = z.object({
  type: z.string(),
  params: z.any(),
});

// TODO use ping/pong messages
export class WsWrapper<
  IncomingSchemaType extends WsSchema,
  OutgoingSchemaType extends WsSchema
> {
  ws: WebSocket;
  handlers: Record<
    keyof IncomingSchemaType,
    (msg: IncomingSchemaType[keyof IncomingSchemaType]) => Promise<void>
  >;

  constructor(ws: WebSocket, incomingSchema: IncomingSchemaType) {
    this.ws = ws;
    this.handlers = {} as any; // TODO figure out why this casting is necessary

    this.ws.on("message", (event) => {
      log("message", event);
      let unserialized;
      try {
        const msgStr = event.toString("utf-8");
        unserialized = JSON.parse(msgStr);
      } catch (e) {
        log("Error parsing", event);
        // TODO close?
        return;
      }

      const parseResult = genericMsgSchema.safeParse(unserialized);
      if (!parseResult.success) {
        log("Invalid message", parseResult.error);
        return;
      }
      const { type, params } = parseResult.data;
      if (!(type in this.handlers)) {
        log("Missing message handler", type);
        // TODO close?
        return;
      }

      const parseResult2 = incomingSchema[type].safeParse(params);
      if (parseResult2.success) {
        this.handlers[type](parseResult2.data).catch((err) => {
          log("Error in handling message", event, err.message);
          // TODO close?
        });
      } else {
        log("Invalid message", event, parseResult2.error);
        return;
      }
    });
  }

  setHandler<MsgType extends keyof IncomingSchemaType>(
    msgType: MsgType,
    handler: (msg: z.infer<IncomingSchemaType[MsgType]>) => Promise<void>
  ) {
    this.handlers[msgType] = handler;
  }

  sendMsg<MsgType extends keyof OutgoingSchemaType>(
    type: MsgType,
    params: z.infer<OutgoingSchemaType[MsgType]>
  ) {
    log("sending", { type, params });
    this.ws.send(JSON.stringify({ type, params }));
  }
}

// TODO clean up
export const initWebsocket = (ws: WebSocket) => {
  ws.on("open", () => {
    log("open");
  });

  ws.on("close", () => {});
  ws.on("error", (err) => {
    console.error("error");
  });
};
