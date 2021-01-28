import { NextApiRequest, NextApiResponse } from "next";
import { TypedServerFunc } from "./baseApi";
import { createHttpHandler, HttpHandler } from "./httpApi";
import { AbstractApiSchemaType, ResSchema } from "./types";

export const createNextHandler = <
  ApiSchemaType extends AbstractApiSchemaType,
  MethodType extends keyof ApiSchemaType
>(
  schema: ApiSchemaType,
  methodName: MethodType,
  handler: TypedServerFunc<ApiSchemaType, typeof methodName, NextApiRequest>
): ((
  req: NextApiRequest,
  resp: NextApiResponse<ResSchema<ApiSchemaType, MethodType>>
) => void) => {
  const httpHandler = createHttpHandler(schema, methodName, handler);
  return async (
    req: NextApiRequest,
    res: NextApiResponse<ResSchema<ApiSchemaType, MethodType>>
  ) => {
    const resp = await httpHandler(req.body, req);
    res.status(resp.status);
    res.json(resp.body);
  };
};
