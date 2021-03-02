import * as z from "zod";

export const localProxyApiSchema = {
  setToken: {
    req: z.object({
      authToken: z.string(),
    }),
    res: z.void(),
  },
  connect: {
    // TODO support void requests
    req: z.object({}),
    res: z.void(),
  },
};
