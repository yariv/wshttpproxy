import * as z from "zod";

export const clientSchema = {
  authorize: z.object({
    authToken: z.string(),
  }),
};

export const serverSchema = {
  unauthorized: z.void(),
  proxy: z.object({
    method: z.string(),
    headers: z.record(z.string()),
    body: z.string(),
  }),
};

export type ClientMsg<msgName extends keyof typeof clientSchema> = z.infer<
  typeof clientSchema[msgName]
>;
export type ServerMsg<msgName extends keyof typeof serverSchema> = z.infer<
  typeof serverSchema[msgName]
>;
