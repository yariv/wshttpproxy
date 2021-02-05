import { config } from "dotenv";
import path from "path";
import { prisma } from "../../router/src/prisma";
import { createOAuthToken } from "../../router/src/utils";
import { initTestDb } from "../../router/src/tests/db";

config({ path: path.resolve(process.cwd(), ".env_test") });

jest.mock("next-auth/client");

export const setupTest = (): ((deferredFunc: () => Promise<void>) => void) => {
  const deferredFuncs: (() => Promise<void>)[] = [
    prisma.$disconnect.bind(prisma),
  ];

  const defer = (func: () => Promise<void>) => {
    deferredFuncs.push(func);
  };

  afterAll(async () => {
    await Promise.all(deferredFuncs.map((func) => func()));
  });

  beforeEach(async () => {
    await initTestDb();
  });

  afterEach(async () => {
    jest.resetAllMocks();
  });

  return defer;
};

const clientId = "test_client";

export const createTestOAuthToken = async (): Promise<string> => {
  const user = await prisma.user.create({ data: {} });
  const token = await createOAuthToken(user.id, clientId);
  return token;
};
