import * as z from "zod";

export const routerApiSchema = {
  createApplication: {
    req: z.object({
      oauthToken: z.string(),
      name: z.string(),
    }),
    res: z.object({
      secret: z.string(),
    }),
  },
  createRoute: {
    req: z.object({
      oauthToken: z.string(),
      applicationSecret: z.string(),
    }),
    res: z.object({
      routeKey: z.string(),
    }),
  },
};
