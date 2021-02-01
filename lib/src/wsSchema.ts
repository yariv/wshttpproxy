import * as z from "zod";

export const clientSchema = {
  authorize: z.object({
    authToken: z.string(),
  }),
};

export const clientSchema2 = z.union([
  z.object({
    type: z.literal("authorize"),
    body: z.object({ authToken: z.string() }),
  }),
  z.object({
    type: z.literal("proxyError"),
    body: z.object({ message: z.string() }),
  }),
  z.object({
    type: z.literal("proxyResult"),
    body: z.object({
      status: z.number(),
      headers: z.record(z.string()),
      body: z.string(),
    }),
  }),
]);

export const serverSchema = {
  unauthorized: z.void(),
  proxy: z.object({
    method: z.string(),
    headers: z.record(z.string()),
    body: z.string(),
  }),
};

export const serverSchema2 = z.union([
  z.object({
    type: z.literal("unauthorized"),
    body: z.object({}),
  }),
  z.object({
    type: z.literal("proxy"),
    body: z.object({
      method: z.string(),
      headers: z.record(z.string()),
      body: z.string(),
    }),
  }),
]);

export type ClientMsg<msgName extends keyof typeof clientSchema> = z.infer<
  typeof clientSchema[msgName]
>;
export type ServerMsg<msgName extends keyof typeof serverSchema> = z.infer<
  typeof serverSchema[msgName]
>;
