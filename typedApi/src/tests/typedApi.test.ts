import { Closeable, start } from "dev-in-prod-lib/dist/appServer";
import next from "next";
import { TypedClient } from "../client";
import { schema } from "../schema";
import path from "path";

describe("typedApi", () => {
  const port = 4829;
  let closeable: Closeable;

  beforeAll(async () => {
    closeable = await start(port, path.resolve(__dirname, "../../"), next);
  });

  afterAll(async () => {
    await closeable.close();
  });

  const client = new TypedClient("http://localhost:" + port + "/api/", schema);

  test("sayHi", async () => {
    const res1 = await client.post("sayHi", { name: "Eve" });
    if (res1.success) {
      expect(res1.parsedBody.salute).toBe("Hi Eve");
    } else {
      fail("Unexpected error");
    }
  });

  test("divide works", async () => {
    const res1 = await client.post("divide", { num1: 15, num2: 5 });
    if (res1.success) {
      expect(res1.parsedBody.result).toBe(3);
    } else {
      fail("Unexpected error");
    }
  });

  test("divide error", async () => {
    const res1 = await client.post("divide", { num1: 15, num2: 0 });
    if (res1.success) {
      fail("Unexpected response");
    } else {
      expect(res1.error).toBe("Can't divide by 0");
      expect(res1.response?.status).toBe(400);
    }
  });
});
