import { ApiHttpError } from "typed-api/src/types";
import { prisma } from "../prisma";
import { sha256 } from "../utils";

export const authorize = async (
  method: string,
  oauthToken: string
): Promise<number> => {
  if (method != "POST") {
    throw new ApiHttpError("Invalid method", 405);
  }
  const token = await prisma.oAuthToken.findUnique({
    where: { tokenHash: sha256(oauthToken) },
  });
  if (!token) {
    throw new ApiHttpError("Invalid oauth token", 401);
  }
  return token.userId;
};
