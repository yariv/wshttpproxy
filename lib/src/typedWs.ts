import * as z from "zod";
import WebSocket from "ws";
import { log } from "./log";

export type WsSchema = Record<string, z.ZodType<any>>;
export type HandlerType<
  IncomingSchemaType extends WsSchema,
  OutgoingSchemaType extends WsSchema
> = (
  wsWrapper: WsWrapper<OutgoingSchemaType>,
  msgType: keyof IncomingSchemaType,
  body: (
    incomingMessageType: typeof msgType
  ) => z.infer<IncomingSchemaType[typeof incomingMessageType]>
) => Promise<void>;

export const initWebsocket = <
  IncomingSchemaType extends WsSchema,
  OutgoingSchemaType extends WsSchema
>(
  ws: WebSocket,
  incomingSchema: IncomingSchemaType,
  handler: HandlerType<typeof incomingSchema, OutgoingSchemaType>
) => {
  const wrapper = new WsWrapper<OutgoingSchemaType>(ws);

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
      log("Error parsing", msgStr);
      return;
    }

    const msgType = unserialized.type;
    if (!msgType || !(msgType in incomingSchema)) {
      log("Missing message type", msgStr);
      return;
    }

    const parseResult = incomingSchema[msgType].safeParse(unserialized);
    if (parseResult.success) {
      handler(wrapper, msgType, parseResult.data).catch((err) => {
        log("Error in handling message", message, err.message);
      });
    } else {
      log("Invalid message", message, parseResult);
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

export class WsWrapper<OutgoingSchemaType extends WsSchema> {
  ws: WebSocket;
  constructor(ws: WebSocket) {
    this.ws = ws;
  }

  sendMsg(
    outgoingMsgType: keyof OutgoingSchemaType,
    body: z.infer<OutgoingSchemaType[typeof outgoingMsgType]>
  ) {
    this.ws.send(JSON.stringify({ outgoingMsgType, body }));
  }
}
