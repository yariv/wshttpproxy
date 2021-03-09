import bodyParser from "koa-bodyparser";
import Router from "koa-router";
import { typedServerFunc, TypedServerFunc } from "./baseApi";
import { createHttpHandler } from "./httpApi";
import { AbstractApiSchemaType } from "./types";
import { Request } from "koa";

export const createKoaRoute = <
  ApiSchemaType extends AbstractApiSchemaType,
  MethodType extends keyof ApiSchemaType
>(
  router: Router,
  schema: ApiSchemaType,
  methodName: MethodType,
  handler: TypedServerFunc<ApiSchemaType, MethodType, Request>
) => {
  const httpHandler = createHttpHandler(
    typedServerFunc(schema, methodName, handler)
  );
  router.post(methodName as string, bodyParser(), async (ctx) => {
    const resp = await httpHandler(ctx.request.body, ctx.request);
    ctx.status = resp.status;
    ctx.body = resp.body;
  });
};
