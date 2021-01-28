import { AbstractApiSchemaType, ReqSchema, ResSchema } from "./types";

type BaseHttpResponse = { response?: Response };

export type ResponseType<ResponseBodyType> =
  | (BaseHttpResponse & {
      success: true;
      body: ResponseBodyType;
    })
  | (BaseHttpResponse & {
      success: false;
      error: any;
    });

export class TypedClient<ApiSchemaType extends AbstractApiSchemaType> {
  baseUrl: string;
  schema: any;

  constructor(baseUrl: string, schema: ApiSchemaType) {
    this.baseUrl = baseUrl;
    this.schema = schema;
  }

  async post<MethodName extends keyof ApiSchemaType>(
    methodName: MethodName,
    reqBody: ReqSchema<ApiSchemaType, typeof methodName>
  ): Promise<ResponseType<ResSchema<ApiSchemaType, typeof methodName>>> {
    const res = await fetch(this.baseUrl + methodName, {
      method: "POST",
      body: JSON.stringify(reqBody),
      headers: { "content-type": "application/json" },
    });
    const respText = await res.text();
    debugger;
    if (!respText) {
      return {
        response: res,
        success: false,
        error: "Server returned empty response",
      };
    }
    const respBody = JSON.parse(respText);
    if (res.status === 200) {
      const parseResult = this.schema[methodName].resSchema.safeParse(respBody);
      if (parseResult.success) {
        // The server returned a successful response
        return {
          response: res,
          success: true,
          body: parseResult.data,
        };
      }
      // The result from the server failed to pass the schema check
      return {
        response: res,
        success: false,
        error: parseResult.error,
      };
    }

    // The server returned an error response.
    return {
      response: res,
      success: false,
      error: respBody.error,
    };
  }
}
