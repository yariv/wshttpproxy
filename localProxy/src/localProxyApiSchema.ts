import * as z from "zod";

export const localProxyApiSchema = {
  setToken: {
    req: z.object({
      token: z.string(),
    }),
    res: z.void(),
  },
  setRouteKey: {
    req: z.object({
      routeKey: z.string(),
    }),
    res: z.void(),
  },
};
