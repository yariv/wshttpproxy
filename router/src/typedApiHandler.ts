import { NextApiRequest, NextApiResponse } from "next";
import { apiSchema, MethodType, ReqSchema, ResSchema } from "./apiSchema";

type ErrorResponse = {
  error: any;
};

type ParsedNextApiRequest<T> = NextApiRequest & {
  parsedBody: T;
};

class HttpError extends Error {
  status: number;

  constructor(message?: string, status: number = 500) {
    super(message);
    this.status = status;
  }
}

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
    if (!parseResult.success) {
      res.status(400).json({ error: parseResult.error });
      res.end();
      return;
    }

    const validatedReq = req as ParsedNextApiRequest<ReqSchema<MethodName>>;
    validatedReq.parsedBody = parseResult.data;
    try {
      return handler(validatedReq, res);
    } catch (error) {
      if (error instanceof HttpError) {
        res.status(error.status).json({ error: error.message });
      } else {
        res.status(500).json({ error });
      }
      res.end();
    }
  };
  return wrappedHandler;
};
