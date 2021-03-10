import {
  AbstractApiSchemaType,
  ReqSchema,
  ResSchema,
  TypedServerFunc,
  UntypedServerFunc,
} from "./types";

// Takes a schema, method name, and a function with an unknown
// return type, and returns a function with a return type
// matching the response schema. If the response
// doesn't match the schema, a Zod error is thrown.
export const getTypedClientFunc = <
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

// This function takes a TypedServerFunc
// and returns an UntypedServerFunc that
// performs validation on the request body,
// potentially throwing a Zod error if the
// request doesn't match the schema.
export const getUntypedServerFunc = <
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
