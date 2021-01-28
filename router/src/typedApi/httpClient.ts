import { AbstractApiSchemaType, ReqSchema, ResSchema } from "./types";

export type ResponseType<ResType, ResponseBodyType> =
  | {
      success: true;
      response: ResType;
      body: ResponseBodyType;
    }
  | {
      success: false;
      response: ResType;
      error: any;
    };

const typedCall = async <
  ApiSchemaType extends AbstractApiSchemaType,
  MethodName extends keyof ApiSchemaType,
  RespType
>(
  schema: ApiSchemaType,
  methodName: MethodName,
  reqBody: ReqSchema<ApiSchemaType, typeof methodName>,
  untypedCall: (req: any) => Promise<[resp: RespType, respBody: any]>
): Promise<
  ResponseType<RespType, ResSchema<ApiSchemaType, typeof methodName>>
> => {
  const [resp, respBody] = await untypedCall(reqBody);
  const parseResult = schema[methodName].res.safeParse(respBody);
  if (parseResult.success) {
    // The server returned a successful response
    return {
      response: resp,
      success: true,
      body: parseResult.data,
    };
  }
  // The result from the server failed to pass the schema check
  return {
    response: resp,
    success: false,
    error: parseResult.error,
  };
};

export class TypedHttpClient<ApiSchemaType extends AbstractApiSchemaType> {
  baseUrl: string;
  schema: any;

  constructor(baseUrl: string, schema: ApiSchemaType) {
    this.baseUrl = baseUrl;
    this.schema = schema;
  }

  async post<MethodName extends keyof ApiSchemaType>(
    methodName: MethodName,
    reqBody: ReqSchema<ApiSchemaType, typeof methodName>
  ): Promise<
    ResponseType<Response, ResSchema<ApiSchemaType, typeof methodName>>
  > {
    return typedCall(
      this.schema,
      methodName,
      JSON.stringify(reqBody),
      async (req) => {
        const res = await fetch(this.baseUrl + methodName, {
          method: "POST",
          body: JSON.stringify(reqBody),
          headers: { "content-type": "application/json" },
        });
        const respText = await res.text();
        const respBody = JSON.parse(respText);
        return [res, respBody];
      }
    );
  }
}
