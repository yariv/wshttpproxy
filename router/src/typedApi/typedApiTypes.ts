import { apiSchema } from "typedApiSchema/schema";
//import { apiSchema } from "../../typedApiSchema/schema";
import * as z from "zod";

export type SchemaType = typeof apiSchema;
export type MethodType = keyof SchemaType;
export type ReqSchema<MethodName extends MethodType> = z.infer<
  typeof apiSchema[MethodName]["reqSchema"]
>;
export type ResSchema<MethodName extends MethodType> = z.infer<
  typeof apiSchema[MethodName]["resSchema"]
>;
