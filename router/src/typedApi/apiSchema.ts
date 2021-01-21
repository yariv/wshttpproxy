import * as z from "zod";

export type SchemaType = typeof apiSchema;
export type MethodType = keyof SchemaType;
export type ReqSchema<MethodName extends MethodType> = z.infer<
  typeof apiSchema[MethodName]["reqSchema"]
>;
export type ResSchema<MethodName extends MethodType> = z.infer<
  typeof apiSchema[MethodName]["resSchema"]
>;

export const apiSchema = {
  createApplication: {
    reqSchema: z.object({
      name: z.string(),
    }),
    resSchema: z.object({
      secret: z.string(),
    }),
  },
};
