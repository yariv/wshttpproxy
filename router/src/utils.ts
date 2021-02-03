import { createHash } from "crypto";
import { genNewToken } from "dev-in-prod-lib/src/utils";
import { prisma } from "./prisma";

export const sha256 = (val: string): string => {
  return createHash("sha256").update(val).digest("hex");
};

export const createOAuthToken = async (
  userId: number,
  clientId: string
): Promise<string> => {
  const token = genNewToken();
  const tokenHash = createHash("sha256").update(token).digest("hex");

  // delete existing tokens from the same client
  await prisma.oAuthToken.deleteMany({
    where: { userId, clientId },
  });

  await prisma.oAuthToken.create({
    data: { clientId, tokenHash, user: { connect: { id: userId } } },
  });

  return token;
};

export type WsKey = string;
export const getWebSocketKey = (
  applicationId: string,
  routeKey: string
): WsKey => applicationId + "_" + routeKey;
