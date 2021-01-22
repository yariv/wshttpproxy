import { apiSchema } from "typedApiSchema";
import { MethodType, ReqSchema, ResSchema } from "./typedApiTypes";

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

export class TypedClient {
  baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  async post(
    methodName: MethodType,

    reqBody: ReqSchema<typeof methodName>
  ): Promise<ResponseType<ResSchema<typeof methodName>>> {
    const res = await fetch(this.baseUrl + methodName, {
      method: "POST",
      body: JSON.stringify(reqBody),
      headers: { "content-type": "application/json" },
    });
    const respBody = await res.json();
    if (res.status === 200) {
      const parseResult = apiSchema[methodName].resSchema.safeParse(respBody);
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
