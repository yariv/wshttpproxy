import * as z from "zod";
// TODO fix import
import { typedServerFunc } from "../../../router/src/typedApi/baseApi";
import storage from "node-persist";
import { initWsClient } from "../wsClient";

const schema = {
  setToken: {
    req: z.object({
      token: z.string(),
    }),
    res: z.void(),
  },
};
export const setToken = typedServerFunc(
  schema,
  "setToken",
  async ({ token }) => {
    await storage.set("token", token);
    const wsClient = initWsClient(token);
  }
);
