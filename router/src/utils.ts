import { createHash } from "crypto";
import { prisma } from "./prisma";

export const sha256 = (val: string): string => {
  return createHash("sha256").update(val).digest("hex");
};

// TODO switch
const charSet =
  "9876543210ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

export const genNewToken = (): string => {
  let res = "";
  for (let i = 0; i < 40; i++) {
    res += charSet[Math.floor(Math.random() * charSet.length)];
  }
  return res;
};

export const createOAuthToken = async (
  userId: number,
  clientId: string
): Promise<string> => {
  const token = genNewToken();
  const tokenHash = sha256(token);

  // delete existing tokens from the same client
  await prisma.oAuthToken.deleteMany({
    where: { userId, clientId },
  });

  await prisma.oAuthToken.create({
    data: { clientId, tokenHash, userId },
  });

  return token;
};

export type WsKey = string;
export const getRouteKey = (oauthToken: string): WsKey =>
  oauthToken.substr(0, 6);
