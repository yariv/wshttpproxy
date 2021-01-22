import * as z from "zod";
const path = "../../router/src/apiSchema";

import { typedApiSchema } from "../../router/typedApiSchema";

export type SchemaType = typeof typedApiSchema;
export type MethodType = keyof SchemaType;
export type ReqSchema<MethodName extends MethodType> = z.infer<
  typeof typedApiSchema[MethodName]["reqSchema"]
>;
export type ResSchema<MethodName extends MethodType> = z.infer<
  typeof typedApiSchema[MethodName]["resSchema"]
>;
