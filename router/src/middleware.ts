import { getSession, Session } from "next-auth/client";
import { IncomingMessage } from "http";
import { ApiHttpError } from "./typedApi/types";
import { User } from "next-auth";

type ExpandedSession = Session & {
  user: User & {
    id: number;
  };
};

export const authorize = async (
  req: IncomingMessage
): Promise<ExpandedSession> => {
  if (req.method != "POST") {
    console.log("FDFVD");
    throw new ApiHttpError("Invalid method", 405);
  }

  const session = await getSession({ req });
  if (!session) {
    console.log("DFBDF");
    throw new ApiHttpError("Not logged in", 401);
  }
  // TODO clean up?
  return session as ExpandedSession;
};
