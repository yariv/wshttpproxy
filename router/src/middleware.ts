import { NextApiRequest } from "next";
import { getSession, Session } from "next-auth/client";

import { ApiHttpError } from "./typedApi/server";

export const authorize = async (req: NextApiRequest): Promise<Session> => {
  if (req.method != "POST") {
    throw new ApiHttpError("Invalid method", 405);
  }

  const session = await getSession({ req });
  if (!session) {
    throw new ApiHttpError("Not logged in", 401);
  }
  return session;
};
