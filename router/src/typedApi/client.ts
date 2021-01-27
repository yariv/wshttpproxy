import { AbstractApiSchemaType, ReqSchema, ResSchema } from "./types";

type BaseHttpResponse = { response?: Response };

export type ResponseType<ParsedBodyType> =
  | (BaseHttpResponse & {
      success: true;
      parsedBody: ParsedBodyType;
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
    try {
      console.log("VSDF", methodName);
      const res = await fetch(this.baseUrl + methodName, {
        method: "POST",
        body: JSON.stringify(reqBody),
        headers: { "content-type": "application/json" },
      });
      console.log("asdfasdf2", methodName, res);
      const respBody = await res.text();
      console.log("asdfasdf", methodName, respBody);
      debugger;
      if (!respBody) {
        return {
          response: res,
          success: false,
          error: "Server returned empty response",
        };
      }
      if (res.status === 200) {
        const respJson = JSON.parse(respBody);
        const parseResult = this.schema[methodName].resSchema.safeParse(
          respJson
        );
        if (parseResult.success) {
          // The server returned a successful response
          return {
            response: res,
            success: true,
            parsedBody: parseResult.data,
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
        error: respBody,
      };
    } catch (e) {
      console.error("FFF", e);
      // An error occurred in sending the request or processing the response.
      return {
        success: false,
        error: e,
      };
    }
  }
}
