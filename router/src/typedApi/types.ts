import * as z from "zod";
import { ZodError } from "zod";

export type AbstractApiSchemaType = Record<
  string,
  { reqSchema: z.ZodType<any>; resSchema: z.ZodType<any> }
>;
export type ReqSchema<
  SchemaType extends AbstractApiSchemaType,
  MethodName extends keyof SchemaType
> = z.infer<SchemaType[MethodName]["reqSchema"]>;
export type ResSchema<
  SchemaType extends AbstractApiSchemaType,
  MethodName extends keyof SchemaType
> = z.infer<SchemaType[MethodName]["resSchema"]>;

export class ApiHttpError extends Error {
  status: number;

  constructor(message: string, status?: number) {
    super(message);
    this.status = status || 500;
  }
}
export type HttpHandler<
  ApiSchemaType extends AbstractApiSchemaType,
  MethodType extends keyof ApiSchemaType,
  ReqType
> = (
  body: ReqSchema<ApiSchemaType, MethodType>,
  req: ReqType
) => Promise<HandlerHttpResult>;

export type HandlerResult<ParsedBodyType> =
  | { success: true; body: ParsedBodyType }
  | { success: false; error: ZodError };

export type HandlerHttpResult = {
  status: number;
  body: any;
};

export type HttpResponse<ParsedBodyType> = HandlerResult<ParsedBodyType> & {
  response?: Response;
};