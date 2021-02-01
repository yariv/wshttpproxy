import { globalConfig } from "dev-in-prod-lib/src/utils";
import { IncomingMessage } from "http";
import bodyParser from "koa-bodyparser";
import Router from "koa-router";
import { typedServerFunc, TypedServerFunc } from "./baseApi";
import { createHttpHandler } from "./httpApi";
import { AbstractApiSchemaType } from "./types";

export const createKoaRoute = <
  ApiSchemaType extends AbstractApiSchemaType,
  MethodType extends keyof ApiSchemaType
>(
  schema: ApiSchemaType,
  methodName: MethodType,
  handler: TypedServerFunc<ApiSchemaType, MethodType, IncomingMessage>
): ((router: Router) => void) => {
  return (router) => {
    const httpHandler = createHttpHandler(
      typedServerFunc(schema, methodName, handler)
    );
    // TODO remove hardcoded prefix
    router.post(
      (globalConfig.routerApiPathPrefix + methodName) as string,
      bodyParser(),
      async (ctx) => {
        const resp = await httpHandler(ctx.request.body, ctx.req);
        ctx.status = resp.status;
        ctx.body = resp.body;
      }
    );
  };
};
