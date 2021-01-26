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
  console.log("XXXXXX");
  const parseResult = schemaType.safeParse(reqBody);
  if (!parseResult.success) {
    return {
      status: 400,
      success: false,
      error: parseResult.error,
    };
  }

  try {
    const handlerResult = await handler(parseResult.data, req);
    return { success: true, body: handlerResult, status: 200 };
  } catch (error) {
    if (error instanceof ApiHttpError) {
      return {
        success: false,
        error: error.message,
        status: error.status,
      };
    }
    return {
      success: false,
      error: error,
      status: 500,
    };
  }
};
