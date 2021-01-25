import { createHandler } from "../src/server";
import { TypedClient } from "../src/client";
import * as z from "zod";
import { Closeable, start } from "dev-in-prod-lib/src/appServer";
import next from "next";
import { schema } from "./testSchema";

describe("typedApi", () => {
  const port = 4829;
  let closeable: Closeable;
  let client: TypedClient<typeof schema>;

  beforeAll(async () => {
    closeable = await start(port, __dirname, next);
    client = new TypedClient("http://localhost:" + port, schema);
  });

  afterAll(async () => {
    await closeable.close();
  });

  test("sayHi", async () => {
    const res1 = await client.post("testSayHi", { name: "Eve" });
    if (res1.success) {
      expect(res1.parsedBody.salute).toBe("Hi Eve");
    } else {
      fail("Unexpected error");
    }
  });

  test("multiply", async () => {
    const res1 = await client.post("testMultiply", { num1: 5, num2: 7 });
    if (res1.success) {
      expect(res1.parsedBody.result).toBe(35);
    } else {
      fail("Unexpected error");
    }
  });
});
