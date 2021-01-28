import {
  AbstractApiSchemaType,
  HandlerResult,
  ReqSchema,
  ResSchema,
} from "./types";

export const typedCall = <
  ApiSchemaType extends AbstractApiSchemaType,
  MethodName extends keyof ApiSchemaType,
  RespType
>(
  schema: ApiSchemaType,
  methodName: MethodName,
  untypedCall: (req: any) => Promise<[resp: RespType, respBody: any]>
): ((
  reqBody: ReqSchema<ApiSchemaType, MethodName>
) => Promise<ResSchema<ApiSchemaType, MethodName>>) => {
  return async (reqBody: ReqSchema<ApiSchemaType, MethodName>) => {
    const [resp, respBody] = await untypedCall(reqBody);
    const parseResult = schema[methodName].res.safeParse(respBody);
    if (parseResult.success) {
      // The server returned a successful response
      return {
        response: resp,
        success: true,
        body: parseResult.data,
      };
    }
    // The result from the server failed to pass the schema check
    return {
      response: resp,
      success: false,
      error: parseResult.error,
    };
  };
};

export type HandlerType<
  ApiSchemaType extends AbstractApiSchemaType,
  MethodType extends keyof ApiSchemaType,
  ReqType
> = (
  params: ReqSchema<ApiSchemaType, MethodType>,
  req: ReqType
) => Promise<ResSchema<ApiSchemaType, MethodType>>;

export const callHandler = async <
  ApiSchemaType extends AbstractApiSchemaType,
  MethodType extends keyof ApiSchemaType,
  ReqType
>(
  schema: ApiSchemaType,
  methodName: MethodType,
  reqBody: any,
  req: ReqType,
  handler: HandlerType<ApiSchemaType, MethodType, ReqType>
): Promise<HandlerResult<ResSchema<ApiSchemaType, typeof methodName>>> => {
  const reqSchemaType = schema[methodName]["req"];
  const parseResult = reqSchemaType.safeParse(reqBody);
  if (!parseResult.success) {
    return {
      success: false,
      error: parseResult.error,
    };
  }

  const handlerResult = await handler(parseResult.data, req);
  return { success: true, body: handlerResult };
};
