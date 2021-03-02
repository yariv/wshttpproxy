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

export const createauthToken = async (): Promise<string> => {
  const token = genNewToken();
  const tokenHash = sha256(token);

  await prisma.authToken.create({
    data: { tokenHash },
  });

  return token;
};

export type WsKey = string;
export const getRouteKey = (authToken: string): WsKey => authToken.substr(0, 6);
