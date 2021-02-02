import * as z from "zod";

export const clientSchema = z.union([
  z.object({
    type: z.literal("connect"),
    params: z.object({
      authToken: z.string(),
      applicationSecret: z.string(),
      routeKey: z.string(),
    }),
  }),
  z.object({
    type: z.literal("proxyError"),
    params: z.object({ requestId: z.string(), message: z.string() }),
  }),
  z.object({
    type: z.literal("proxyResult"),
    params: z.object({
      requestId: z.string(),
      status: z.number(),
      statusText: z.string(),
      headers: z.record(z.string()),
      body: z.string().optional(),
    }),
  }),
]);

export const serverSchema = z.union([
  z.object({
    type: z.literal("proxy"),
    params: z.object({
      path: z.string(),
      requestId: z.string(),
      method: z.string(),
      headers: z.record(z.string()),
      body: z.string(),
    }),
  }),
  z.object({
    type: z.literal("connection_error"),
    params: z.object({
      message: z.string(),
    }),
  }),
]);
