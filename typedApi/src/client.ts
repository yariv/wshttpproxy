import * as z from "zod";
import { AbstractApiSchemaType, ReqSchema, ResSchema } from "./types";

type BaseResponse = { response?: Response };

export type ResponseType<ParsedBodyType> =
  | (BaseResponse & {
      success: true;
      parsedBody: ParsedBodyType;
    })
  | (BaseResponse & {
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
      const res = await fetch(this.baseUrl + methodName, {
        method: "POST",
        body: JSON.stringify(reqBody),
        headers: { "content-type": "application/json" },
      });
      const respBody = await res.text();
      const respJson = JSON.parse(respBody);
      const parseResult = this.schema[methodName].resSchema.safeParse(respJson);
      if (parseResult.success) {
        if (res.status === 200) {
          // The server returned a successful response
          return {
            response: res,
            success: true,
            parsedBody: parseResult.data,
          };
        }
        // The server returned an error response.
        return {
          response: res,
          success: false,
          error: parseResult.data,
        };
      } else {
        // The result from the server failed to pass the schema check
        return {
          response: res,
          success: false,
          error: parseResult.error,
        };
      }
    } catch (e) {
      // An error occurred in sending the request or processing the response.
      return {
        success: false,
        error: e,
      };
    }
  }
}
