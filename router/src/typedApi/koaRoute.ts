import Router from "@koa/router";
import { ParameterizedContext } from "koa";
import { createHandler } from "./server";
import { AbstractApiSchemaType, ReqSchema, ResSchema } from "./types";

export const createRoute = <
  ApiSchemaType extends AbstractApiSchemaType,
  MethodType extends keyof ApiSchemaType
>(
  schema: ApiSchemaType,
  methodName: MethodType,
  router: Router,
  handler: (
    params: ReqSchema<ApiSchemaType, typeof methodName>,
    req?: ParameterizedContext
  ) => Promise<ResSchema<ApiSchemaType, typeof methodName>>
) => {
  const baseHandler = createHandler<
    ApiSchemaType,
    MethodType,
    ParameterizedContext
  >(schema, methodName, handler);

  router.post(methodName as string, async (ctx) => {
    const resp = await baseHandler(ctx.body, ctx);
    ctx.status = resp.status;
    if (resp.success) {
      ctx.body = resp.body;
    } else {
      ctx.body = resp.error;
    }
  });
};
