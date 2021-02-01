import client from "next-auth/client";
import { prisma } from "../prisma";
import { config } from "dotenv";
import path from "path";
import { createOAuthToken } from "../utils";

config({ path: path.resolve(process.cwd(), ".env_test") });

const clientId = "test_client";

export const createTestOAuthToken = async (): Promise<string> => {
  const user = await prisma.user.create({ data: {} });
  const token = await createOAuthToken(user.id, clientId);
  return token;
};
