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
};
