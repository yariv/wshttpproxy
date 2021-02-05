import client from "next-auth/client";
import { prisma } from "../prisma";
import { config } from "dotenv";
import path from "path";
import { createOAuthToken } from "../utils";
import { getRouterApiUrl, globalConfig } from "dev-in-prod-lib/src/utils";
import { routerMain } from "../../routerMain";
import { routerApiSchema } from "../routerApiSchema";
import { TypedHttpClient } from "../typedApi/httpApi";
import { initTestDb } from "./db";

config({ path: path.resolve(process.cwd(), ".env_test") });

jest.mock("next-auth/client");

export const setupTest = (): TypedHttpClient<typeof routerApiSchema> => {
  let closeFunc: () => Promise<void>;

  const client = new TypedHttpClient(getRouterApiUrl(), routerApiSchema);

  beforeAll(async () => {
    closeFunc = await routerMain(globalConfig.routerPort);
  });

  afterAll(async () => {
    await Promise.all([closeFunc(), prisma.$disconnect()]);
  });

  beforeEach(async () => {
    await initTestDb();
  });

  afterEach(async () => {
    jest.resetAllMocks();
  });

  return client;
};

const clientId = "test_client";

export const createTestOAuthToken = async (): Promise<string> => {
  const user = await prisma.user.create({ data: {} });
  const token = await createOAuthToken(user.id, clientId);
  return token;
};
