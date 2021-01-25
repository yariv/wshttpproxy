import * as z from "zod";

export const schema = {
  sayHi: {
    reqSchema: z.object({
      name: z.string(),
    }),
    resSchema: z.object({
      salute: z.string(),
    }),
  },

  divide: {
    reqSchema: z.object({
      num1: z.number(),
      num2: z.number(),
    }),
    resSchema: z.object({
      result: z.number(),
    }),
  },
};
