import Koa from "koa";
import Router from "koa-router";
import { Server } from "net";
import { createKoaRoute } from "../src/koaAdapter";
import { ApiHttpError } from "../src/types";
import portfinder from "portfinder";

import { TypedHttpClient } from "../src/httpApi";

import { testSchema } from "./testSchema";

const pathPrefix = "/api";
const createServer = (port: number): Server => {
  const koa = new Koa();
  const apiRouter = new Router({
    prefix: pathPrefix,
  });

  createKoaRoute(apiRouter, testSchema, "divide", async ({ num1, num2 }) => {
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

// const testClient = async () => {
//   const client = new TypedHttpClient("http://localhost:3001/api", testSchema);
//   let result = await client.call("divide", { num1: 10, num2: 2 });
//   result = "test";
// };

// testClient();

describe("typedApi createKoaRoute", () => {
  let client: TypedHttpClient<typeof testSchema>;
  let server: Server;

  beforeAll(async () => {
    const port = await portfinder.getPortPromise();

    const client = new TypedHttpClient(
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

  test("schema error", async () => {
    try {
      await client.call("divide", {} as any);
    } catch (e) {
      console.error(e);
    }
  });
});
