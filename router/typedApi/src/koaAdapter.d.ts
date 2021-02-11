import { Request } from "koa";
import Router from "koa-router";
import { TypedServerFunc } from "./baseApi";
export declare const createKoaRoute: <ApiSchemaType extends Record<string, {
    req: import("zod").ZodType<any, import("zod").ZodTypeDef>;
    res: import("zod").ZodType<any, import("zod").ZodTypeDef>;
}>, MethodType extends keyof ApiSchemaType>(schema: ApiSchemaType, methodName: MethodType, handler: TypedServerFunc<ApiSchemaType, MethodType, Request>) => (router: Router) => void;
//# sourceMappingURL=koaAdapter.d.ts.map