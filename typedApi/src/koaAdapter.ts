import bodyParser from "koa-bodyparser";
import Router from "koa-router";
import { getUntypedServerFunc } from "./baseApi";
import { AbstractApiSchemaType, TypedServerFunc } from "./types";
import { Request } from "koa";
import { createHttpHandler } from "./httpServer";

// Create a route with the given Koa router. The route implements
// a method from the given schema.
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
    getUntypedServerFunc(schema, methodName, handler)
  );
  router.post(methodName as string, bodyParser(), async (ctx) => {
    const resp = await httpHandler(ctx.request.body, ctx.request);
    ctx.status = resp.status;
    ctx.body = resp.status === 200 ? JSON.stringify(resp.body) : resp.body;
  });
};
