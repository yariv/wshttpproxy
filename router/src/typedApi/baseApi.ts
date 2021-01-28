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
  return async (reqBody: ReqSchema<ApiSchemaType, MethodName>) => {
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
