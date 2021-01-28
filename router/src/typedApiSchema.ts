import * as z from "zod";

export const typedApiSchema = {
  createApplication: {
    req: z.object({
      name: z.string(),
    }),
    res: z.object({
      secret: z.string(),
    }),
  },
  createRoute: {
    req: z.object({
      applicationSecret: z.string(),
    }),
    res: z.object({
      routeKey: z.string(),
    }),
  },
};
