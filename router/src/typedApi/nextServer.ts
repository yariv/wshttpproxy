import { NextApiRequest, NextApiResponse } from "next";
import { createHandler } from "./server";
import { AbstractApiSchemaType, ReqSchema, ResSchema } from "./types";

export type ParsedNextApiRequest<T> = NextApiRequest & {
  parsedBody: T;
};

export const createNextHandler = <
  ApiSchemaType extends AbstractApiSchemaType,
  MethodType extends keyof ApiSchemaType
>(
  schema: ApiSchemaType,
  methodName: MethodType,
  handler: (
    body: ReqSchema<ApiSchemaType, typeof methodName>,
    req: NextApiRequest
  ) => Promise<ResSchema<ApiSchemaType, typeof methodName>>
): ((
  req: NextApiRequest,
  resp: NextApiResponse<ResSchema<ApiSchemaType, typeof methodName>>
) => void) => {
  const baseHandler = createHandler(schema, methodName, handler);
  const wrappedHandler = async (
    req: NextApiRequest,
    res: NextApiResponse<ResSchema<ApiSchemaType, typeof methodName>>
  ) => {
    const resp = await baseHandler(req.body, req);
    if (resp.success) {
      res.status(resp.status);
      res.json(resp.body);
    } else {
      res.status(resp.status);
      res.write(resp.error);
    }
    res.end();
  };
  return wrappedHandler;
};
