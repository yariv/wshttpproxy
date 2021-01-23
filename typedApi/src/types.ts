import * as z from "zod";

export type AbstractApiSchemaType = Record<
  string,
  { reqSchema: z.ZodType<any>; resSchema: z.ZodType<any> }
>;
export type ReqSchema<
  SchemaType extends AbstractApiSchemaType,
  MethodName extends keyof SchemaType
> = z.infer<SchemaType[MethodName]["reqSchema"]>;
export type ResSchema<
  SchemaType extends AbstractApiSchemaType,
  MethodName extends keyof SchemaType
> = z.infer<SchemaType[MethodName]["resSchema"]>;
