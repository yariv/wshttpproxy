import { NextApiRequest, NextApiResponse } from "next";
import { apiSchema, MethodType, ReqSchema, ResSchema } from "./apiSchema";

type ErrorResponse = {
  error: any;
};

type ParsedNextApiRequest<T> = NextApiRequest & {
  parsedBody: T;
};

export const createHandler = <MethodName extends MethodType>(
  methodName: MethodName,
  handler: (
    req: ParsedNextApiRequest<ReqSchema<MethodName>>,
    res: NextApiResponse<ResSchema<MethodName> | ErrorResponse>
  ) => Promise<void>
): ((
  req: NextApiRequest,
  resp: NextApiResponse<ResSchema<MethodName> | ErrorResponse>
) => void) => {
  const wrappedHandler = async (
    req: NextApiRequest,
    res: NextApiResponse<ResSchema<MethodName> | ErrorResponse>
  ) => {
    const schemaType = apiSchema[methodName].reqSchema;
    const parseResult = schemaType.safeParse(req.body);
    if (parseResult.success) {
      const validatedReq = req as ParsedNextApiRequest<ReqSchema<MethodName>>;
      validatedReq.parsedBody = parseResult.data;
      try {
        return handler(validatedReq, res);
      } catch (error) {
        res.status(500).json({ error });
      }
    } else {
      res.status(400).json({ error: parseResult.error });
    }
    res.end();
  };
  return wrappedHandler;
};
