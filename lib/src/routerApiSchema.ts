import * as z from "zod";

export const routerApiSchema = {
  createAuthToken: {
    req: z.object({}),
    res: z.object({
      oauthToken: z.string(),
    }),
  },
};
