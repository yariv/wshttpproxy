import { NextApiRequest, NextApiResponse } from "next";
import { TypedServerFunc } from "./baseApi";
import { ResSchema } from "./types";
export declare const createNextHandler: <ApiSchemaType extends Record<string, {
    req: import("zod").ZodType<any, import("zod").ZodTypeDef>;
    res: import("zod").ZodType<any, import("zod").ZodTypeDef>;
}>, MethodType extends keyof ApiSchemaType>(schema: ApiSchemaType, methodName: MethodType, handler: TypedServerFunc<ApiSchemaType, MethodType, NextApiRequest>) => (req: NextApiRequest, resp: NextApiResponse<import("zod").TypeOf<ApiSchemaType[MethodType]["res"]>>) => void;
//# sourceMappingURL=nextAdapter.d.ts.map