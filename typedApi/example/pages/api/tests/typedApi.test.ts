import { AppServer, startNextServer } from "dev-in-prod-lib/src/appServer";
import next from "next";
import { TypedHttpClient } from "../../../../src/httpApi";
import path from "path";
import { schema } from "../../../schema";

describe("typedApi", () => {
  const port = 4829;
  let appServer: AppServer;

  beforeAll(async () => {
    appServer = await startNextServer(
      port,
      path.resolve(__dirname, "../../"),
      next
    );
  });

  afterAll(async () => {
    await appServer.close();
  });

  const client = new TypedHttpClient(
    "http://localhost:" + port + "/api/",
    schema
  );

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
