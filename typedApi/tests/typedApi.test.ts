import { AppServer, startNextServer } from "dev-in-prod-lib/src/appServer";
import next from "next";
import { TypedHttpClient } from "../src/httpApi";
import path from "path";
import { schema } from "../example/src/schema";

describe("typedApi", () => {
  let appServer: AppServer;
  let client: TypedHttpClient<typeof schema>;

  beforeAll(async () => {
    appServer = await startNextServer(
      0,
      path.resolve(__dirname, "../example"),
      next
    );
    client = new TypedHttpClient(appServer.apiUrl, schema);
  });

  afterAll(async () => {
    await appServer.close();
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
    expect(
      async () => await client.call("divide", { num1: 15, num2: 0 })
    ).toThrowError("Can't divide by 0");
  });
});
