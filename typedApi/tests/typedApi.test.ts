import Koa from "koa";
import Router from "koa-router";
import { Server } from "net";
import portfinder from "portfinder";
import { TypedHttpClient } from "../src/httpApi";
import { createKoaRoute } from "../src/koaAdapter";
import { ApiHttpError } from "../src/types";
import { testSchema } from "./schema";

const pathPrefix = "/api";

const createServer = async (port: number): Promise<Server> => {
  const koa = new Koa();
  const apiRouter = new Router({
    prefix: pathPrefix,
  });

  createKoaRoute(apiRouter, testSchema, "divide", async ({ num1, num2 }) => {
    console.log(num1, num2);
    if (num2 === 0) {
      throw new ApiHttpError("Can't divide by 0", 400);
    }
    return num1 / num2;
  });

  createKoaRoute(apiRouter, testSchema, "sayHi", async ({ name }) => {
    return "Hi " + name;
  });

  koa.use(apiRouter.allowedMethods());
  koa.use(apiRouter.routes());
  return koa.listen(port);
};

describe("typedApi", () => {
  let client: TypedHttpClient<typeof testSchema>;
  let server: Server;

  beforeAll(async () => {
    const port = await portfinder.getPortPromise();
    client = new TypedHttpClient(
      "http://localhost:" + port + pathPrefix,
      testSchema
    );
    server = await createServer(port);
  });

  afterAll(async () => {
    await server.close();
  });

  test("sayHi", async () => {
    const res = await client.call("sayHi", { name: "Eve" });
    expect(res).toStrictEqual("Hi Eve");
  });

  test("divide works", async () => {
    const res = await client.call("divide", { num1: 15, num2: 5 });
    expect(res).toStrictEqual(3);
  });

  test("divide error", async () => {
    try {
      await client.call("divide", { num1: 15, num2: 0 });
      fail();
    } catch (e) {
      expect(e.message).toStrictEqual("Can't divide by 0");
    }
  });
});
