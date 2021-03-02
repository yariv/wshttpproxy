import * as z from "zod";

export const clientSchema = {
  connect: z.object({
    oauthToken: z.string(),
    // applicationSecret: z.string(),
    // routeKey: z.string(),
  }),
  proxyError: z.object({
    requestId: z.string(),
    message: z.string(),
  }),
  proxyResult: z.object({
    requestId: z.string(),
    status: z.number(),
    headers: z.record(z.string()),
    body: z.string().optional(),
  }),
};

export const serverSchema = {
  proxy: z.object({
    path: z.string(),
    requestId: z.string(),
    method: z.string(),
    headers: z.record(z.string()),
    body: z.string().optional(),
  }),
  connectionError: z.object({
    message: z.string(),
  }),
  connected: z.void(),
  invalidRequestId: z.object({
    requestId: z.string(),
  }),
};
