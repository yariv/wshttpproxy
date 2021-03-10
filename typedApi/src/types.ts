import * as z from "zod";

// The basic SolidRPC schema type.
export type AbstractApiSchemaType = Record<
  string,
  { req: z.ZodType<any>; res: z.ZodType<any> }
>;

// Returns the type of the request schema
// given the schema and the method name.
export type ReqSchema<
  SchemaType extends AbstractApiSchemaType,
  MethodName extends keyof SchemaType
> = z.infer<SchemaType[MethodName]["req"]>;

// Returns the type of the response schema
// given the schema and the method name.
export type ResSchema<
  SchemaType extends AbstractApiSchemaType,
  MethodName extends keyof SchemaType
> = z.infer<SchemaType[MethodName]["res"]>;

export class ApiHttpError extends Error {
  status: number;

  constructor(message: string, status?: number) {
    super(message);
    this.status = status || 500;
  }
}

// A typed server function is a function that takes parameters
// that adhere to the request schema as well as the original
// request object, which is specific to each server-side
// framework (Koa, NextJS, etc).
export type TypedServerFunc<
  ApiSchemaType extends AbstractApiSchemaType,
  MethodType extends keyof ApiSchemaType,
  ReqType
> = (
  params: ReqSchema<ApiSchemaType, MethodType>,
  req: ReqType
) => Promise<ResSchema<ApiSchemaType, MethodType>>;

// An untyped server function takes a request body
// of an unknown type and returns a response
// type that adheres to the method's response schema.
export type UntypedServerFunc<
  ApiSchemaType extends AbstractApiSchemaType,
  MethodType extends keyof ApiSchemaType,
  ReqType
> = (
  reqBody: any,
  req: ReqType
) => Promise<ResSchema<ApiSchemaType, MethodType>>;
