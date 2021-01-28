import {
  AbstractApiSchemaType,
  ApiHttpError,
  HandlerResult,
  ReqSchema,
  ResSchema,
  HandlerHttpResult,
  HttpHandler,
} from "./types";

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

export const createHttpHandler = <
  ApiSchemaType extends AbstractApiSchemaType,
  MethodType extends keyof ApiSchemaType,
  ReqType
>(
  schema: ApiSchemaType,
  methodName: MethodType,
  handler: HandlerType<ApiSchemaType, typeof methodName, ReqType>
): HttpHandler<ApiSchemaType, typeof methodName, ReqType> => {
  return async (
    reqBody: ReqSchema<ApiSchemaType, typeof methodName>,
    req: ReqType
  ): Promise<HandlerHttpResult> => {
    try {
      const resp = await callHandler(schema, methodName, reqBody, req, handler);
      if (resp.success) {
        return { status: 200, body: resp.body };
      }
      return { status: 400, body: resp.error };
    } catch (err) {
      if (!err.status || err.status === 500) {
        console.error("Unexpected error", err);
      }
      return { status: err.status || 500, body: err.message };
    }
  };
};
