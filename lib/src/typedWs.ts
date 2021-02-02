import * as z from "zod";
import WebSocket from "ws";
import { log } from "./log";
import { serverSchema } from "./wsSchema";

export type WsSchema = Record<string, z.ZodType<any>>;

export type WsHandlerType<IncomingSchemaType extends WsSchema> = (
  msgType: keyof IncomingSchemaType,
  msg: z.infer<IncomingSchemaType[typeof msgType]>
) => Promise<void>;

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
      const msgType = unserialized.type;
      if (!msgType) {
        log("Missing message type", unserialized);
        // TODO close?
        return;
      }
      if (!(msgType in this.handlers)) {
        log("Invalid message type", unserialized);
        // TODO close?
        return;
      }

      const parseResult = incomingSchema[msgType].safeParse(unserialized);
      if (!parseResult.success) {
        log("Invalid message", event.data, parseResult);
        debugger;
        return;
      }
      this.handlers[msgType](parseResult.data).catch((err) => {
        log("Error in handling message", event, err.message);
        // TODO close?
      });
    });
  }

  setHandler<MsgType extends keyof IncomingSchemaType>(
    msgType: MsgType,
    handler: (msg: z.infer<IncomingSchemaType[MsgType]>) => Promise<void>
  ) {
    this.handlers[msgType] = handler;
  }

  sendMsg<MsgType extends keyof OutgoingSchemaType>(
    msg: z.infer<OutgoingSchemaType[MsgType]>
  ) {
    this.ws.send(JSON.stringify(msg));
  }
}

// TODO clean up
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
