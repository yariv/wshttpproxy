import { NextApiRequest, NextApiResponse } from "next";
import { createHttpHandler } from "./httpServer";
import { AbstractApiSchemaType, ResSchema, TypedServerFunc } from "./types";

// Create a NextJS API handler for the method of the given schema.
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
  const httpHandler = createHttpHandler(handler);
  return async (
    req: NextApiRequest,
    res: NextApiResponse<ResSchema<ApiSchemaType, MethodType>>
  ) => {
    const resp = await httpHandler(req.body, req);
    res.status(resp.status);
    res.json(resp.body);
  };
};
