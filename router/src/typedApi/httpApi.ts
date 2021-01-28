import { callHandler, HandlerType, typedFunc } from "./baseApi";
import {
  AbstractApiSchemaType,
  ReqSchema,
  ResSchema,
  HandlerResult,
  ApiHttpError,
} from "./types";

export type HandlerHttpResult = {
  status: number;
  body: any;
};

export type HttpResponse<ParsedBodyType> = HandlerResult<ParsedBodyType> & {
  response?: Response;
};
export type HttpHandler<
  ApiSchemaType extends AbstractApiSchemaType,
  MethodType extends keyof ApiSchemaType,
  ReqType
> = (
  body: ReqSchema<ApiSchemaType, MethodType>,
  req: ReqType
) => Promise<HandlerHttpResult>;

export class TypedHttpClient<ApiSchemaType extends AbstractApiSchemaType> {
  baseUrl: string;
  schema: ApiSchemaType;

  constructor(baseUrl: string, schema: ApiSchemaType) {
    this.baseUrl = baseUrl;
    this.schema = schema;
  }

  async post<MethodName extends keyof ApiSchemaType>(
    methodName: MethodName,
    reqBody: ReqSchema<ApiSchemaType, typeof methodName>
  ): Promise<ResSchema<ApiSchemaType, typeof methodName>> {
    return typedFunc(this.schema, methodName, async (reqBody) => {
      const res = await fetch(this.baseUrl + methodName, {
        method: "POST",
        body: JSON.stringify(reqBody),
        headers: { "content-type": "application/json" },
      });
      const respText = await res.text();
      if (res.status >= 400 && res.status < 600) {
        throw new ApiHttpError(respText, res.status);
      }
      const respBody = JSON.parse(respText);
      return respBody;
    })(reqBody);
  }
}

export const createHttpHandler = <
  ApiSchemaType extends AbstractApiSchemaType,
  MethodType extends keyof ApiSchemaType,
  ReqType
>(
  schema: ApiSchemaType,
  methodName: MethodType,
  handler: HandlerType<ApiSchemaType, typeof methodName, ReqType>
): HttpHandler<ApiSchemaType, typeof methodName, ReqType> => {
  return async (
    reqBody: ReqSchema<ApiSchemaType, typeof methodName>,
    req: ReqType
  ): Promise<HandlerHttpResult> => {
    try {
      const resp = await callHandler(schema, methodName, reqBody, req, handler);
      if (resp.success) {
        return { status: 200, body: resp.body };
      }
      return { status: 400, body: resp.error };
    } catch (err) {
      if (!err.status || err.status === 500) {
        console.error("Unexpected error", err);
      }
      return { status: err.status || 500, body: err.message };
    }
  };
};
