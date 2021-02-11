import { AbstractApiSchemaType, ReqSchema, ResSchema } from "./types";

export const typedClientFunc = <
  ApiSchemaType extends AbstractApiSchemaType,
  MethodName extends keyof ApiSchemaType
>(
  schema: ApiSchemaType,
  methodName: MethodName,
  untypedClientFunc: (req: ReqSchema<ApiSchemaType, MethodName>) => Promise<any>
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

export type UntypedServerFunc<
  ApiSchemaType extends AbstractApiSchemaType,
  MethodType extends keyof ApiSchemaType,
  ReqType
> = (
  reqBody: any,
  req: ReqType
) => Promise<ResSchema<ApiSchemaType, MethodType>>;

export const typedServerFunc = <
  ApiSchemaType extends AbstractApiSchemaType,
  MethodType extends keyof ApiSchemaType,
  ReqType
>(
  schema: ApiSchemaType,
  methodName: MethodType,
  handler: TypedServerFunc<ApiSchemaType, MethodType, ReqType>
): UntypedServerFunc<ApiSchemaType, MethodType, ReqType> => {
  return async (reqBody, req) => {
    const reqSchemaType = schema[methodName]["req"];
    const parsedBody = reqSchemaType.parse(reqBody);
    return handler(parsedBody, req);
  };
};
