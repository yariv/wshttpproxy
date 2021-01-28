import { IncomingMessage } from "http";
import bodyParser from "koa-bodyparser";
import Router from "koa-router";
import { HttpHandler } from "./httpApi";
import { AbstractApiSchemaType } from "./types";

export const createKoaRoute = <
  ApiSchemaType extends AbstractApiSchemaType,
  MethodType extends keyof ApiSchemaType
>(
  methodName: MethodType,
  router: Router,
  handler: HttpHandler<ApiSchemaType, MethodType, IncomingMessage>
) => {
  // TODO remove hardcoded prefix
  router.post(("/api2/" + methodName) as string, bodyParser(), async (ctx) => {
    const resp = await handler(ctx.request.body, ctx.req);
    ctx.status = resp.status;
    ctx.body = JSON.stringify(resp.body);
  });
};
