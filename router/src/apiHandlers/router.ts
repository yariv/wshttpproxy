import Router from "koa-router";
import { createApplicationHandler } from "./createApplication";
import { createRouteHandler } from "./createRoute";

export const router = new Router();
createApplicationHandler(router);
createRouteHandler(router);
