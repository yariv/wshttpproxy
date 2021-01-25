import { getSession, Session } from "next-auth/client";
import { HttpError } from "typed-api/src/server";

export const authorize = async (req: any): Promise<Session> => {
  if (req.method != "POST") {
    throw new HttpError({ status: 405 });
  }

  const session = await getSession({ req });
  if (!session) {
    throw new HttpError({ message: "Not logged in", status: 401 });
  }
  return session;
};
