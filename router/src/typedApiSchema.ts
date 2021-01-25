import * as z from "zod";

export const typedApiSchema = {
  createApplication: {
    reqSchema: z.object({
      name: z.string(),
    }),
    resSchema: z.object({
      secret: z.string(),
    }),
  },
  createRoute: {
    reqSchema: z.object({
      applicationSecret: z.string(),
    }),
    resSchema: z.object({
      key: z.string(),
    }),
  },
};
