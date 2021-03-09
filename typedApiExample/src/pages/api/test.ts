import { NextApiRequest, NextApiResponse } from "next";
import { TypedServerFunc } from "../../../../src/baseApi";
//import { createHttpHandler } from "../../../../src/httpServer";
import type {
  AbstractApiSchemaType,
  HttpHandler,
  ResSchema,
} from "../../../../src/types";
import { createHttpHandler } from "../../httpServer";
import { schema } from "../../schema";

// export const createHttpHandler = <
//   ApiSchemaType extends AbstractApiSchemaType,
//   MethodType extends keyof ApiSchemaType,
//   ReqType
// >(
//   typedFunc: TypedServerFunc<ApiSchemaType, MethodType, ReqType>
// ): HttpHandler<ReqType> => {
//   return async (reqBody, req) => {
//     try {
//       const resp = await typedFunc(reqBody, req);
//       return { status: 200, body: JSON.stringify(resp) };
//     } catch (err) {
//       if (err instanceof ZodError) {
//         // TODO send more informative error messages
//         console.error("Zod error", err);
//         return { status: 400, body: "Invalid request" };
//       }
//       if (!err.status || err.status === 500) {
//         console.error("Unexpected error", err);
//       }
//       return { status: err.status || 500, body: err.message };
//     }
//   };
// };

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

export default createNextHandler(schema, "sayHi", async ({ name }) => {
  return "Hi " + name;
});

// export default async (req: NextApiRequest, res: NextApiResponse) => {
//   res.status(200);
//   res.json({ a: 1 });
// };
