import * as z from "zod";
export declare type AbstractApiSchemaType = Record<string, {
    req: z.ZodType<any>;
    res: z.ZodType<any>;
}>;
export declare type ReqSchema<SchemaType extends AbstractApiSchemaType, MethodName extends keyof SchemaType> = z.infer<SchemaType[MethodName]["req"]>;
export declare type ResSchema<SchemaType extends AbstractApiSchemaType, MethodName extends keyof SchemaType> = z.infer<SchemaType[MethodName]["res"]>;
export declare class ApiHttpError extends Error {
    status: number;
    constructor(message: string, status?: number);
}
export declare type HandlerResult<ParsedBodyType> = {
    success: true;
    body: ParsedBodyType;
} | {
    success: false;
    error: string;
};
export declare type HttpResponse<ParsedBodyType> = HandlerResult<ParsedBodyType> & {
    response?: Response;
};
export declare type ResponseType<ResType, ResponseBodyType> = {
    success: true;
    response: ResType;
    body: ResponseBodyType;
} | {
    success: false;
    response: ResType;
    error: any;
};
//# sourceMappingURL=types.d.ts.map