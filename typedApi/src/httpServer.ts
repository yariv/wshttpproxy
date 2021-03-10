import { ZodError } from "zod";
import { AbstractApiSchemaType, TypedServerFunc } from "./types";

type HttpHandler<ReqType> = (
  body: any,
  req: ReqType
) => Promise<{ status: number; body: any }>;

// Create a a function that takes an untyped request and returns a
// an object representing a HTTP response containing a status
// and body. The body is a JSON serialized string.
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
        return { status: 400, body: JSON.stringify(err.errors) };
      }
      return { status: err.status || 500, body: JSON.stringify(err.message) };
    }
  };
};
