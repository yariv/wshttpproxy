import { IncomingMessage } from "http";
import bodyParser from "koa-bodyparser";
import Router from "koa-router";
import { TypedServerFunc, UntypedServerFunc } from "./baseApi";
import { createHttpHandler, HttpHandler } from "./httpApi";
import { AbstractApiSchemaType } from "./types";

export const createKoaRoute = <
  ApiSchemaType extends AbstractApiSchemaType,
  MethodType extends keyof ApiSchemaType
>(
  router: Router,
  schema: ApiSchemaType,
  methodName: MethodType,
  handler: TypedServerFunc<ApiSchemaType, MethodType, IncomingMessage>
) => {
  console.log(methodName, handler);
  const httpHandler = createHttpHandler(handler);
  // TODO remove hardcoded prefix
  router.post(("/api2/" + methodName) as string, bodyParser(), async (ctx) => {
    const resp = await httpHandler(ctx.request.body, ctx.req);
    ctx.status = resp.status;
    ctx.body = resp.body;
  });
};
