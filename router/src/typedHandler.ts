import { NextApiRequest, NextApiResponse } from "next";
import { getSession, Session } from "next-auth/client";
import { apiSchema, MethodType, ReqSchema, ResSchema } from "./apiSchema";

export const createHandler = <MethodName extends MethodType>(
  methodName: MethodName,
  handler: (
    req: NextApiRequest,
    res: NextApiResponse<ResSchema<MethodName>>,
    body: ReqSchema<MethodName>,
    session: Session
  ) => Promise<void>
): ((
  req: NextApiRequest,
  resp: NextApiResponse<ResSchema<MethodName>>
) => void) => {
  const wrappedHandler = async (
    req: NextApiRequest,
    res: NextApiResponse<ResSchema<MethodName>>
  ) => {
    if (req.method != "POST") {
      res.status(405).end();
      return;
    }
    const session = await getSession({ req });
    if (!session) {
      res.status(401).end();
      return;
    }

    const schemaType = apiSchema[methodName].reqSchema;
    const body = schemaType.parse(req.body);
    if (schemaType.check(body)) {
      return handler(req, res, body, session);
    }
  };
  return wrappedHandler;
};
