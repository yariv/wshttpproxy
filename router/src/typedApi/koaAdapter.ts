import { IncomingMessage } from "http";
import bodyParser from "koa-bodyparser";
import Router from "koa-router";
import { callHandler } from "./server";
import {
  AbstractApiSchemaType,
  HandlerResult,
  ReqSchema,
  ResSchema,
} from "./types";
import koaBody from "koa-body";

export const createKoaRoute = <
  ApiSchemaType extends AbstractApiSchemaType,
  MethodType extends keyof ApiSchemaType
>(
  schema: ApiSchemaType,
  methodName: MethodType,
  router: Router,
  handler: (
    params: ReqSchema<ApiSchemaType, typeof methodName>,
    req: IncomingMessage
  ) => Promise<HandlerResult<ResSchema<ApiSchemaType, typeof methodName>>>
) => {
  router.post(("/api2/" + methodName) as string, bodyParser(), async (ctx) => {
    const resp = await handler(ctx.request.body, ctx.req);
    debugger;
    if (resp.success) {
      ctx.status = 200;
      ctx.body = resp.body;
    } else {
      ctx.status = resp.error.status || 500;
      ctx.body = resp.error.message;
    }
  });
};
