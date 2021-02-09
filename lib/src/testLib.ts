import { config } from "dotenv";
import path from "path";

import { getApiUrl } from "./utils";
import { TypedHttpClient } from "typed-api/src/httpApi";
import { routerApiSchema } from "./routerApiSchema";

config({ path: path.resolve(process.cwd(), ".env_test") });

jest.mock("next-auth/client");

export const setupTest = (): ((deferredFunc: () => Promise<void>) => void) => {
  const deferredFuncs: (() => Promise<void>)[] = [];

  const defer = (func: () => Promise<void>) => {
    deferredFuncs.push(func);
  };

  afterAll(async () => {
    await Promise.all(deferredFuncs.map((func) => func()));
  });

  afterEach(async () => {
    jest.resetAllMocks();
  });

  return defer;
};
