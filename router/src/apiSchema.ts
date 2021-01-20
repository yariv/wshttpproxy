import * as z from "zod";

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

export type MethodType = keyof typeof apiSchema;
export type ReqSchema<M extends MethodType> = z.infer<
  typeof apiSchema[M]["reqSchema"]
>;
export type ResSchema<M extends MethodType> = z.infer<
  typeof apiSchema[M]["resSchema"]
>;
