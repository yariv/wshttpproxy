import * as z from "zod";
import { ZodError } from "zod";

export type AbstractApiSchemaType = Record<
  string,
  { req: z.ZodType<any>; res: z.ZodType<any> }
>;
export type ReqSchema<
  SchemaType extends AbstractApiSchemaType,
  MethodName extends keyof SchemaType
> = z.infer<SchemaType[MethodName]["req"]>;
export type ResSchema<
  SchemaType extends AbstractApiSchemaType,
  MethodName extends keyof SchemaType
> = z.infer<SchemaType[MethodName]["res"]>;

export class ApiHttpError extends Error {
  status: number;

  constructor(message: string, status?: number) {
    super(message);
    this.status = status || 500;
  }
}

export type HandlerResult<ParsedBodyType> =
  | { success: true; body: ParsedBodyType }
  | { success: false; error: string };

export type HttpResponse<ParsedBodyType> = HandlerResult<ParsedBodyType> & {
  response?: Response;
};

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
