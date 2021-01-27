import { NextApiRequest, NextApiResponse } from "next";
import {
  AbstractApiSchemaType,
  HandlerResult,
  ReqSchema,
  ResSchema,
} from "./types";

export type ParsedNextApiRequest<T> = NextApiRequest & {
  parsedBody: T;
};

export const createNextHandler = <
  ApiSchemaType extends AbstractApiSchemaType,
  MethodType extends keyof ApiSchemaType
>(
  handler: (
    body: ReqSchema<ApiSchemaType, MethodType>,
    req: NextApiRequest
  ) => Promise<HandlerResult<ResSchema<ApiSchemaType, MethodType>>>
): ((
  req: NextApiRequest,
  resp: NextApiResponse<ResSchema<ApiSchemaType, MethodType>>
) => void) => {
  const wrappedHandler = async (
    req: NextApiRequest,
    res: NextApiResponse<ResSchema<ApiSchemaType, MethodType>>
  ) => {
    const resp = await handler(req.body, req);
    debugger;
    if (resp.success) {
      res.status(200);
      res.json(resp.body);
    } else {
      res.status(resp.error.status || 500);
      res.json({ error: resp.error });
    }
    res.end();
  };
  return wrappedHandler;
};
