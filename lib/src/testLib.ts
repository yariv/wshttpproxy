import { config } from "dotenv";
import path from "path";

// TODO remove
import { prisma } from "../../router/src/prisma";
import { initTestDb } from "../../router/src/tests/db";

import { getRouterApiUrl } from "./utils";
import { TypedHttpClient } from "typed-api/src/httpApi";
import { routerApiSchema } from "./routerApiSchema";

config({ path: path.resolve(process.cwd(), ".env_test") });

jest.mock("next-auth/client");

export const setupTest = (): ((deferredFunc: () => Promise<void>) => void) => {
  const deferredFuncs: (() => Promise<void>)[] = [
    prisma.$disconnect.bind(prisma),
  ];

  const defer = (func: () => Promise<void>) => {
    deferredFuncs.push(func);
  };

  beforeAll(async () => {
    await initTestDb();
  });

  afterAll(async () => {
    await Promise.all(deferredFuncs.map((func) => func()));
  });

  afterEach(async () => {
    jest.resetAllMocks();
  });

  return defer;
};

const createTestOAuthToken = async (): Promise<string> => {
  const client = new TypedHttpClient(getRouterApiUrl(), routerApiSchema);
  const { oauthToken } = await client.post("createTestOAuthToken");
  return oauthToken;
};
