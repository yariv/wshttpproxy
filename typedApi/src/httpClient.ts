import { typedClientFunc } from "./baseApi";
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


export class TypedHttpClient<ApiSchemaType extends AbstractApiSchemaType> {
  baseUrl: string;
  schema: ApiSchemaType;

  constructor(baseUrl: string, schema: ApiSchemaType) {
    this.baseUrl = baseUrl;
    this.schema = schema;
  }

  async call<MethodName extends keyof ApiSchemaType>(
    methodName: MethodName,
    reqBody: ReqSchema<ApiSchemaType, typeof methodName> = {}
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
