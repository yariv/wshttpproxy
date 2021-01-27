import {
  AbstractApiSchemaType,
  ApiHttpError,
  HandlerResult,
  ReqSchema,
  ResSchema,
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

  try {
    const handlerResult = await handler(parseResult.data, req);
    return { success: true, body: handlerResult };
  } catch (err) {
    return {
      success: false,
      error: err,
    };
  }
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
