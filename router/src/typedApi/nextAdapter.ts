import { NextApiRequest, NextApiResponse } from "next";
import { AbstractApiSchemaType, HttpHandler, ResSchema } from "./types";

export const createNextHandler = <
  ApiSchemaType extends AbstractApiSchemaType,
  MethodType extends keyof ApiSchemaType
>(
  handler: HttpHandler<ApiSchemaType, MethodType, NextApiRequest>
): ((
  req: NextApiRequest,
  resp: NextApiResponse<ResSchema<ApiSchemaType, MethodType>>
) => void) => {
  return async (
    req: NextApiRequest,
    res: NextApiResponse<ResSchema<ApiSchemaType, MethodType>>
  ) => {
    const resp = await handler(req.body, req);
    res.status(resp.status);
    res.json(resp.body);
  };
};
