import * as z from "zod";
import WebSocket from "ws";
import { log } from "./log";
import { serverSchema } from "./wsSchema";
import { typedServerFunc } from "../../router/src/typedApi/baseApi";

export type WsSchema = Record<string, z.ZodType<any>>;

export type WsHandlerType<IncomingSchemaType extends WsSchema> = (
  msgType: keyof IncomingSchemaType,
  msg: z.infer<IncomingSchemaType[typeof msgType]>
) => Promise<void>;

const genericMsgSchema = z.object({
  type: z.string(),
  params: z.any(),
});

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

    this.ws.on("message", (event: WebSocket.MessageEvent) => {
      log("message", event.data);
      const msgStr = event.data.toString("utf-8");
      let unserialized;
      try {
        unserialized = JSON.parse(msgStr);
      } catch (e) {
        log("Error parsing", msgStr);
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
        log("Invalid message", event.data, parseResult);
        debugger;
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
    console.log("ASDF", type, params);
    this.ws.send(JSON.stringify({ type, params }));
  }
}

// TODO clean up
export const initWebsocket = (ws: WebSocket) => {
  ws.on("open", () => {
    log("open");
  });

  ws.on("close", () => {
    console.log("close");
  });
  ws.on("error", (err) => {
    console.error("error");
  });
};
