import * as z from "zod";

export const clientSchema = z.union([
  z.object({
    type: z.literal("authorize"),
    body: z.object({ authToken: z.string() }),
  }),
  z.object({
    type: z.literal("proxyError"),
    body: z.object({ requestId: z.string(), message: z.string() }),
  }),
  z.object({
    type: z.literal("proxyResult"),
    body: z.object({
      requestId: z.string(),
      status: z.number(),
      statusText: z.string(),
      headers: z.record(z.string()),
      body: z.string(),
    }),
  }),
]);

export const serverSchema = z.union([
  z.object({
    type: z.literal("unauthorized"),
  }),
  z.object({
    type: z.literal("proxy"),
    body: z.object({
      requestId: z.string(),
      method: z.string(),
      headers: z.record(z.string()),
      body: z.string(),
    }),
  }),
]);
