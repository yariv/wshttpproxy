import { getTypedClientFunc } from "./baseApi";
import {
  AbstractApiSchemaType,
  ApiHttpError,
  ReqSchema,
  ResSchema,
} from "./types";
import fetch from "node-fetch";

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
    return getTypedClientFunc(this.schema, methodName, async (reqBody) => {
      const res = await fetch(this.baseUrl + methodName, {
        method: "POST",
        body: JSON.stringify(reqBody),
        headers: { "content-type": "application/json" },
      });
      const respText = await res.text();
      if (res.status >= 400 && res.status < 600) {
        throw new ApiHttpError(respText, res.status);
      }
      return JSON.parse(respText);
    })(reqBody);
  }
}
