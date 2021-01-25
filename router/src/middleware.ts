import { NextApiRequest } from "next";
import { getSession, Session } from "next-auth/client";
import { ApiHttpError } from "typed-api/src/server";

export const authorize = async (req: NextApiRequest): Promise<Session> => {
  if (req.method != "POST") {
    throw new ApiHttpError({ status: 405 });
  }

  const session = await getSession({ req });
  if (!session) {
    throw new ApiHttpError({ message: "Not logged in", status: 401 });
  }
  return session;
};
