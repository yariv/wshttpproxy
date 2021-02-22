import * as z from "zod";

export const localProxyApiSchema = {
  setToken: {
    req: z.object({
      oauthToken: z.string(),
    }),
    res: z.void(),
  },
  connect: {
    req: z.void(),
    res: z.void(),
  },
};
