import WebSocket from "ws";
import * as z from "zod";

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

  constructor(
    ws: WebSocket,
    incomingSchema: IncomingSchemaType,

    // This parameter is only used for enforcing the right type
    // definition for OutgoingSchemaType
    outgoingSchema: OutgoingSchemaType
  ) {
    this.ws = ws;
    this.handlers = {} as any; // TODO figure out why this casting is necessary

    this.ws.on("message", (event) => {
      let unserialized;
      try {
        const msgStr = event.toString("utf-8");
        unserialized = JSON.parse(msgStr);
      } catch (e) {
        console.error("Error parsing", event);
        // TODO close?
        return;
      }

      const parseResult = genericMsgSchema.safeParse(unserialized);
      if (!parseResult.success) {
        console.warn("Invalid message", parseResult.error);
        return;
      }
      const { type, params } = parseResult.data;
      if (!(type in this.handlers)) {
        console.warn("Missing message handler", type);
        // TODO close?
        return;
      }

      const parseResult2 = incomingSchema[type].safeParse(params);
      if (parseResult2.success) {
        this.handlers[type](parseResult2.data).catch((err) => {
          console.error("Error in handling message", event, err.message);
          this.ws.close();
        });
      } else {
        console.warn("Invalid message", event, parseResult2.error);
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
    params?: z.infer<OutgoingSchemaType[MsgType]>
  ) {
    this.ws.send(JSON.stringify({ type, params }));
  }
}

// TODO clean up
export const initWebsocket = (ws: WebSocket) => {
  ws.on("open", () => {
    console.log("open");
  });

  ws.on("close", () => {});
  ws.on("error", (err) => {
    console.error("error", err);
  });
};
