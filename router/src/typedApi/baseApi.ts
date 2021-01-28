import { parse } from "dotenv/types";
import {
  AbstractApiSchemaType,
  HandlerResult,
  ReqSchema,
  ResSchema,
} from "./types";

export const typedClientFunc = <
  ApiSchemaType extends AbstractApiSchemaType,
  MethodName extends keyof ApiSchemaType
>(
  schema: ApiSchemaType,
  methodName: MethodName,
  untypedClientFunc: (req: any) => Promise<ResSchema<ApiSchemaType, MethodName>>
): ((
  reqBody: ReqSchema<ApiSchemaType, MethodName>
) => Promise<ResSchema<ApiSchemaType, MethodName>>) => {
  return async (reqBody) => {
    const respBody = await untypedClientFunc(reqBody);
    const parseResult = schema[methodName].res.parse(respBody);
    return parseResult;
  };
};

export type TypedServerFunc<
  ApiSchemaType extends AbstractApiSchemaType,
  MethodType extends keyof ApiSchemaType,
  ReqType
> = (
  params: ReqSchema<ApiSchemaType, MethodType>,
  req: ReqType
) => Promise<ResSchema<ApiSchemaType, MethodType>>;

export const callTypedServerFunc = async <
  ApiSchemaType extends AbstractApiSchemaType,
  MethodType extends keyof ApiSchemaType,
  ReqType
>(
  schema: ApiSchemaType,
  methodName: MethodType,
  reqBody: any,
  req: ReqType,
  handler: TypedServerFunc<ApiSchemaType, MethodType, ReqType>
): Promise<HandlerResult<ResSchema<ApiSchemaType, typeof methodName>>> => {
  const reqSchemaType = schema[methodName]["req"];
  // TODO switch to parse() for consistency?
  const parseResult = reqSchemaType.safeParse(reqBody);
  if (!parseResult.success) {
    return {
      success: false,
      // TODO return more informative error messages
      // (see https://github.com/colinhacks/zod/blob/master/ERROR_HANDLING.md)
      error: "Invalid request",
    };
  }

  const handlerResult = await handler(parseResult.data, req);
  return { success: true, body: handlerResult };
};

export const typedServerFunc = <
  ApiSchemaType extends AbstractApiSchemaType,
  MethodType extends keyof ApiSchemaType,
  ReqType
>(
  schema: ApiSchemaType,
  methodName: MethodType,
  handler: TypedServerFunc<ApiSchemaType, MethodType, ReqType>
): ((
  reqBody: any,
  req: ReqType
) => Promise<HandlerResult<ResSchema<ApiSchemaType, typeof methodName>>>) => {
  return async (reqBody, req) => {
    const reqSchemaType = schema[methodName]["req"];
    // TODO switch to parse() for consistency?
    const parseResult = reqSchemaType.safeParse(reqBody);
    if (!parseResult.success) {
      return {
        success: false,
        // TODO return more informative error messages
        // (see https://github.com/colinhacks/zod/blob/master/ERROR_HANDLING.md)
        error: "Invalid request",
      };
    }

    const handlerResult = await handler(parseResult.data, req);
    return { success: true, body: handlerResult };
  };
};
