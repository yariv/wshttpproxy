import * as z from "zod";
import { AbstractApiSchemaType, ReqSchema, ResSchema } from "./types";

type BaseResponse = { response: Response };

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
    const res = await fetch(this.baseUrl + methodName, {
      method: "POST",
      body: JSON.stringify(reqBody),
      headers: { "content-type": "application/json" },
    });
    const respBody = await res.json();
    if (res.status === 200) {
      const parseResult = this.schema[methodName].resSchema.safeParse(respBody);
      if (parseResult.success) {
        return {
          response: res,
          success: true,
          parsedBody: parseResult.data,
        };
      } else {
        return {
          response: res,
          success: false,
          error: parseResult.error,
        };
      }
    }
    return {
      response: res,
      error: respBody.error,
      success: false,
    };
  }
}
