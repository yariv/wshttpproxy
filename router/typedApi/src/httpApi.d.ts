import { TypedServerFunc } from "./baseApi";
import { AbstractApiSchemaType, HandlerResult, ReqSchema, ResSchema } from "./types";
export declare type HttpResponse<ParsedBodyType> = HandlerResult<ParsedBodyType> & {
    response?: Response;
};
export declare type HttpHandler<ReqType> = (body: any, req: ReqType) => Promise<{
    status: number;
    body: any;
}>;
export declare class TypedHttpClient<ApiSchemaType extends AbstractApiSchemaType> {
    baseUrl: string;
    schema: ApiSchemaType;
    constructor(baseUrl: string, schema: ApiSchemaType);
    call<MethodName extends keyof ApiSchemaType>(methodName: MethodName, reqBody?: ReqSchema<ApiSchemaType, typeof methodName>): Promise<ResSchema<ApiSchemaType, typeof methodName>>;
}
export declare const createHttpHandler: <ApiSchemaType extends Record<string, {
    req: import("zod").ZodType<any, import("zod").ZodTypeDef>;
    res: import("zod").ZodType<any, import("zod").ZodTypeDef>;
}>, MethodType extends keyof ApiSchemaType, ReqType>(typedFunc: TypedServerFunc<ApiSchemaType, MethodType, ReqType>) => HttpHandler<ReqType>;
//# sourceMappingURL=httpApi.d.ts.map