import { AbstractApiSchemaType, ReqSchema, ResSchema } from "./types";
export declare const typedClientFunc: <ApiSchemaType extends Record<string, {
    req: import("zod").ZodType<any, import("zod").ZodTypeDef>;
    res: import("zod").ZodType<any, import("zod").ZodTypeDef>;
}>, MethodName extends keyof ApiSchemaType>(schema: ApiSchemaType, methodName: MethodName, untypedClientFunc: (req: import("zod").TypeOf<ApiSchemaType[MethodName]["req"]>) => Promise<any>) => (reqBody: import("zod").TypeOf<ApiSchemaType[MethodName]["req"]>) => Promise<import("zod").TypeOf<ApiSchemaType[MethodName]["res"]>>;
export declare type TypedServerFunc<ApiSchemaType extends AbstractApiSchemaType, MethodType extends keyof ApiSchemaType, ReqType> = (params: ReqSchema<ApiSchemaType, MethodType>, req: ReqType) => Promise<ResSchema<ApiSchemaType, MethodType>>;
export declare type UntypedServerFunc<ApiSchemaType extends AbstractApiSchemaType, MethodType extends keyof ApiSchemaType, ReqType> = (reqBody: any, req: ReqType) => Promise<ResSchema<ApiSchemaType, MethodType>>;
export declare const typedServerFunc: <ApiSchemaType extends Record<string, {
    req: import("zod").ZodType<any, import("zod").ZodTypeDef>;
    res: import("zod").ZodType<any, import("zod").ZodTypeDef>;
}>, MethodType extends keyof ApiSchemaType, ReqType>(schema: ApiSchemaType, methodName: MethodType, handler: TypedServerFunc<ApiSchemaType, MethodType, ReqType>) => UntypedServerFunc<ApiSchemaType, MethodType, ReqType>;
//# sourceMappingURL=baseApi.d.ts.map