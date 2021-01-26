import { NextApiRequest, NextApiResponse } from "next";
import { AbstractApiSchemaType, ReqSchema, ResSchema } from "./types";

export type ErrorResponse = {
  error: any;
};

export type ParsedNextApiRequest<T> = NextApiRequest & {
  parsedBody: T;
};

export class ApiHttpError extends Error {
  status: number;

  constructor({ message, status }: { message?: string; status?: number }) {
    super(message);
    this.status = status || 500;
  }
}

export const createHandler = <
  ApiSchemaType extends AbstractApiSchemaType,
  MethodType extends keyof ApiSchemaType
>(
  schema: ApiSchemaType,
  methodName: MethodType,
  handler: (
    req: ParsedNextApiRequest<ReqSchema<ApiSchemaType, typeof methodName>>
  ) => Promise<ResSchema<ApiSchemaType, typeof methodName>>
): ((
  req: NextApiRequest,
  resp: NextApiResponse<
    ResSchema<ApiSchemaType, typeof methodName> | ErrorResponse
  >
) => void) => {
  const wrappedHandler = async (
    req: NextApiRequest,
    res: NextApiResponse<
      ResSchema<ApiSchemaType, typeof methodName> | ErrorResponse
    >
  ) => {
    const schemaType = schema[methodName].reqSchema;
    const parseResult = schemaType.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ error: parseResult.error });
      res.end();
      return;
    }

    const validatedReq = req as ParsedNextApiRequest<
      ReqSchema<ApiSchemaType, typeof methodName>
    >;
    validatedReq.parsedBody = parseResult.data;
    try {
      debugger;
      console.log("XXX2");
      const handlerResult = await handler(validatedReq);
      console.log("XXX1");
      res.status(200).json(handlerResult);
    } catch (error) {
      console.log("XXX3");
      if (error instanceof ApiHttpError) {
        res.status(error.status).json({ error: error.message });
      } else {
        console.error("SDFADF", error);
        res.status(500).json({ error });
      }
    }
    res.end();
  };
  return wrappedHandler;
};
