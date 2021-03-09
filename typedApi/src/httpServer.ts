import { ZodError } from "zod";
import { TypedServerFunc } from "./baseApi";
import { AbstractApiSchemaType, HttpHandler } from "./types";

export const createHttpHandler = <
  ApiSchemaType extends AbstractApiSchemaType,
  MethodType extends keyof ApiSchemaType,
  ReqType
>(
  typedFunc: TypedServerFunc<ApiSchemaType, MethodType, ReqType>
): HttpHandler<ReqType> => {
  return async (reqBody, req) => {
    try {
      const resp = await typedFunc(reqBody, req);
      return { status: 200, body: JSON.stringify(resp) };
    } catch (err) {
      if (err instanceof ZodError) {
        // TODO send more informative error messages
        console.error("Zod error", err);
        return { status: 400, body: "Invalid request" };
      }
      if (!err.status || err.status === 500) {
        console.error("Unexpected error", err);
      }
      return { status: err.status || 500, body: err.message };
    }
  };
};
