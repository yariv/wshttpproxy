import * as z from "zod";

export const clientSchema = z.object({
  type: z.literal("authorize"),
  authToken: z.string(),
});

export const serverSchema = z.union([
  z.object({
    type: z.literal("authorized"),
  }),
  z.object({
    type: z.literal("unauthorized"),
  }),
  z.object({
    type: z.literal("proxy"),
    method: z.string(),
    headers: z.record(z.string()),
    body: z.string(),
  }),
  z.object({
    type: z.literal("invalidMessage"),
    message: z.any(),
  }),
]);
