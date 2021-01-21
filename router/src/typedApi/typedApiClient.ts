import { apiSchema, MethodType, ReqSchema, ResSchema } from "./apiSchema";

export type ResponseType<ParsedBodyType> = {
  response: Response;
  parsedBody?: ParsedBodyType;
  error?: any;
  status: number;
};

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
      const parsedBody = apiSchema[methodName].resSchema.parse(respBody);
      return {
        response: res,
        parsedBody: parsedBody,
        status: res.status,
      };
    }
    return {
      response: res,
      error: respBody.error,
      status: res.status,
    };
  }
}
