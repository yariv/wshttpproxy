import * as z from "zod";

export const clientSchema2 = {
  connect: z.object({
    authToken: z.string(),
    applicationSecret: z.string(),
    routeKey: z.string(),
  }),
  proxyError: z.object({
    requestId: z.string(),
    message: z.string(),
  }),
  proxyResult: z.object({
    requestId: z.string(),
    status: z.number(),
    statusText: z.string(),
    headers: z.record(z.string()),
    body: z.string().optional(),
  }),
};

export const serverSchema2 = {
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
};
