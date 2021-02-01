import { globalConfig } from "dev-in-prod-lib/src/utils";
import { IncomingMessage } from "http";
import bodyParser from "koa-bodyparser";
import Router from "koa-router";
import { TypedServerFunc } from "./baseApi";
import { createHttpHandler } from "./httpApi";
import { AbstractApiSchemaType } from "./types";

export const createKoaRoute = <
  ApiSchemaType extends AbstractApiSchemaType,
  MethodType extends keyof ApiSchemaType
>(
  // Note: the schema parameter is used for inferring ApiSchemaType
  // and MethodType without passing them in as type parameters.
  // (passing in only ApiSchemaType while inferring MethodType doesn't seem to work).
  schema: ApiSchemaType,
  methodName: MethodType,
  handler: TypedServerFunc<ApiSchemaType, MethodType, IncomingMessage>
): ((router: Router) => void) => {
  return (router) => {
    console.log(methodName, handler);
    const httpHandler = createHttpHandler(handler);
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
