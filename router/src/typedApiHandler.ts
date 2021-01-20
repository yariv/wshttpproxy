import { NextApiRequest, NextApiResponse } from "next";
import { getSession, Session } from "next-auth/client";
import { ZodError } from "zod";
import { apiSchema, MethodType, ReqSchema, ResSchema } from "./apiSchema";

type Err = {
  error: any;
};

type ValidatedNextApiRequest<T> = NextApiRequest & {
  validatedBody: T;
};

export const createHandler = <MethodName extends MethodType>(
  methodName: MethodName,
  handler: (
    req: ValidatedNextApiRequest<ReqSchema<MethodName>>,
    res: NextApiResponse<ResSchema<MethodName> | Err>,
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
      res.status(401).json({ error: "Not logged in" });
      res.end();
      return;
    }

    const schemaType = apiSchema[methodName].reqSchema;
    try {
      const body = schemaType.parse(req.body);
      const validatedReq = req as ValidatedNextApiRequest<
        ReqSchema<MethodName>
      >;
      validatedReq.validatedBody = body;
      if (schemaType.check(body)) {
        return handler(validatedReq, res, session);
      }
    } catch (e) {
      const status = e instanceof ZodError ? 400 : 500;
      res.status(status).json({ error: e });
      res.end();
    }
  };
  return wrappedHandler;
};
