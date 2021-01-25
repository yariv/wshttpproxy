import { Closeable, start } from "dev-in-prod-lib/src/appServer";
import next from "next";
import { TypedClient } from "../client";
import { schema } from "../schema";
import path from "path";

describe("typedApi", () => {
  const port = 4829;
  let closeable: Closeable;
  let client: TypedClient<typeof schema>;

  beforeAll(async () => {
    closeable = await start(port, path.resolve(__dirname, "../../"), next);
    client = new TypedClient("http://localhost:" + port, schema);
  });

  afterAll(async () => {
    await closeable.close();
  });

  test("sayHi", async () => {
    debugger;
    const res1 = await client.post("sayHi", { name: "Eve" });
    if (res1.success) {
      expect(res1.parsedBody.salute).toBe("Hi Eve");
    } else {
      fail("Unexpected error");
    }
  });

  test("multiply", async () => {
    const res1 = await client.post("multiply", { num1: 5, num2: 7 });
    if (res1.success) {
      expect(res1.parsedBody.result).toBe(35);
    } else {
      fail("Unexpected error");
    }
  });
});
