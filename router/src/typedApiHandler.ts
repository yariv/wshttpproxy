import { NextApiRequest, NextApiResponse } from "next";
import { getSession, Session } from "next-auth/client";
import { ZodError } from "zod";
import { apiSchema, MethodType, ReqSchema, ResSchema } from "./apiSchema";

type Err = {
  error: any;
};

export const createHandler = <MethodName extends MethodType>(
  methodName: MethodName,
  handler: (
    req: NextApiRequest,
    res: NextApiResponse<ResSchema<MethodName> | Err>,
    body: ReqSchema<MethodName>,
    session: Session
  ) => Promise<void>
): ((
  req: NextApiRequest,
  resp: NextApiResponse<ResSchema<MethodName> | Err>
) => void) => {
  const wrappedHandler = async (
    req: NextApiRequest,
    res: NextApiResponse<ResSchema<MethodName> | Err>
  ) => {
    if (req.method != "POST") {
      res.status(405).end();
      return;
    }
    const session = await getSession({ req });
    if (!session) {
      res.json({ error: "Not logged in" });
      res.status(401).end();
      return;
    }

    const schemaType = apiSchema[methodName].reqSchema;
    try {
      const body = schemaType.parse(req.body);
      if (schemaType.check(body)) {
        return handler(req, res, body, session);
      }
    } catch (e) {
      const status = e instanceof ZodError ? 400 : 500;
      res.json({ error: e });
      res.status(status).end();
    }
  };
  return wrappedHandler;
};
