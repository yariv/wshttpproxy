import { resolveTripleslashReference } from "typescript";
import { ZodError } from "zod";
import { typedClientFunc, TypedServerFunc, UntypedServerFunc } from "./baseApi";
import {
  AbstractApiSchemaType,
  ApiHttpError,
  HandlerResult,
  ReqSchema,
  ResSchema,
} from "./types";

export type HttpResponse<ParsedBodyType> = HandlerResult<ParsedBodyType> & {
  response?: Response;
};
export type HttpHandler<ReqType> = (
  body: any,
  req: ReqType
) => Promise<{ status: number; body: any }>;

export class TypedHttpClient<ApiSchemaType extends AbstractApiSchemaType> {
  baseUrl: string;
  schema: ApiSchemaType;

  constructor(baseUrl: string, schema: ApiSchemaType) {
    this.baseUrl = baseUrl;
    this.schema = schema;
  }

  async call<MethodName extends keyof ApiSchemaType>(
    methodName: MethodName,
    reqBody?: ReqSchema<ApiSchemaType, typeof methodName>
  ): Promise<ResSchema<ApiSchemaType, typeof methodName>> {
    return typedClientFunc(this.schema, methodName, async (reqBody) => {
      const res = await fetch(this.baseUrl + methodName, {
        method: "POST",
        body: JSON.stringify(reqBody),
        headers: { "content-type": "application/json" },
      });
      const respText = await res.text();
      if (res.status >= 400 && res.status < 600) {
        throw new ApiHttpError(respText, res.status);
      }
      if (respText) {
        return JSON.parse(respText);
      }
      return;
    })(reqBody);
  }
}

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
        return { status: 400, body: "Invalid request" };
      }
      if (!err.status || err.status === 500) {
        console.error("Unexpected error", err);
      }
      return { status: err.status || 500, body: err.message };
    }
  };
};
