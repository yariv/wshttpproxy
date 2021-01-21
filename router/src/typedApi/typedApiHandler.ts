import { NextApiRequest, NextApiResponse } from "next";
import { apiSchema } from "./apiSchema";
import { MethodType, ReqSchema, ResSchema } from "./typedApiTypes";

export type ErrorResponse = {
  error: any;
};

export type ParsedNextApiRequest<T> = NextApiRequest & {
  parsedBody: T;
};

export class HttpError extends Error {
  status: number;

  constructor({ message, status }: { message?: string; status?: number }) {
    super(message);
    this.status = status || 500;
  }
}

export const createHandler = <MethodName extends MethodType>(
  methodName: MethodName,
  handler: (
    req: ParsedNextApiRequest<ReqSchema<MethodName>>
  ) => Promise<ResSchema<MethodName>>
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
      const handlerResult = await handler(validatedReq);
      res.status(200).json(handlerResult);
    } catch (error) {
      if (error instanceof HttpError) {
        res.status(error.status).json({ error: error.message });
      } else {
        res.status(500).json({ error });
      }
    }
    res.end();
  };
  return wrappedHandler;
};
