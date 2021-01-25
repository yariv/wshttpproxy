import * as z from "zod";
import { AbstractApiSchemaType } from "../src/types";

export const schema = {
  testSayHi: {
    reqSchema: z.object({
      name: z.string(),
    }),
    resSchema: z.object({
      salute: z.string(),
    }),
  },

  testMultiply: {
    reqSchema: z.object({
      num1: z.number(),
      num2: z.number(),
    }),
    resSchema: z.object({
      result: z.number(),
    }),
  },
};
