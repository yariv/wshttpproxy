import { getSession, Session } from "next-auth/client";
import { IncomingMessage } from "http";
import { ApiHttpError } from "./typedApi/types";

export const authorize = async (req: IncomingMessage): Promise<Session> => {
  if (req.method != "POST") {
    throw new ApiHttpError("Invalid method", 405);
  }

  const session = await getSession({ req });
  if (!session) {
    throw new ApiHttpError("Not logged in", 401);
  }
  return session;
};
