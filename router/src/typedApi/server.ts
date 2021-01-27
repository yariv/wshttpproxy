import {
  AbstractApiSchemaType,
  ApiHttpError,
  HandlerResult,
  ReqSchema,
  ResSchema,
  HandlerHttpResult,
  HttpHandler,
} from "./types";

export const callHandler = async <
  ApiSchemaType extends AbstractApiSchemaType,
  MethodType extends keyof ApiSchemaType,
  ReqType
>(
  schema: ApiSchemaType,
  methodName: MethodType,
  reqBody: any,
  req: any,
  handler: (
    params: ReqSchema<ApiSchemaType, typeof methodName>,
    req: ReqType
  ) => Promise<ResSchema<ApiSchemaType, typeof methodName>>
): Promise<HandlerResult<ResSchema<ApiSchemaType, typeof methodName>>> => {
  const schemaType = schema[methodName].reqSchema;
  const parseResult = schemaType.safeParse(reqBody);
  if (!parseResult.success) {
    return {
      success: false,
      error: parseResult.error,
    };
  }

  const handlerResult = await handler(parseResult.data, req);
  return { success: true, body: handlerResult };
};

export const wrapHandler = <
  ApiSchemaType extends AbstractApiSchemaType,
  MethodType extends keyof ApiSchemaType,
  ReqType
>(
  schema: ApiSchemaType,
  methodName: MethodType,
  handler: (
    params: ReqSchema<ApiSchemaType, typeof methodName>,
    req: ReqType
  ) => Promise<ResSchema<ApiSchemaType, typeof methodName>>
): ((
  body: ReqSchema<ApiSchemaType, typeof methodName>,
  req: ReqType
) => Promise<HandlerResult<ResSchema<ApiSchemaType, typeof methodName>>>) => {
  return (
    reqBody: ReqSchema<ApiSchemaType, typeof methodName>,
    req: ReqType
  ): Promise<HandlerResult<ResSchema<ApiSchemaType, typeof methodName>>> => {
    return callHandler(schema, methodName, reqBody, req, handler);
  };
};

export const createHttpHandler = <
  ApiSchemaType extends AbstractApiSchemaType,
  MethodType extends keyof ApiSchemaType,
  ReqType
>(
  schema: ApiSchemaType,
  methodName: MethodType,
  handler: (
    params: ReqSchema<ApiSchemaType, typeof methodName>,
    req: ReqType
  ) => Promise<ResSchema<ApiSchemaType, typeof methodName>>
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
      if (!err.status) {
        console.error("Unexpected error", err);
      }
      return { status: err.status || 500, body: { error: err.message } };
    }
  };
};
