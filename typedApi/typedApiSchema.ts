import * as z from "zod";

export const typedApiSchema = {
  testMethod: {
    reqSchema: z.object({
      param1: z.string(),
    }),
    resSchema: z.object({
      param2: z.string(),
    }),
  },
};
