import { Closeable } from "dev-in-prod-lib/src/appServer";
import { globalConfig } from "dev-in-prod-lib/src/utils";
import { main } from "../../../../main";
import { prisma } from "../../../prisma";
import { TypedHttpClient } from "../../../typedApi/httpApi";
import { initTestDb } from "../../db";
import { setupMockSession } from "../../testLib";
import { typedApiSchema } from "../../../typedApiSchema";
jest.mock("next-auth/client");

describe("createApplication", () => {
  let closeable: Closeable;

  const client = new TypedHttpClient(
    globalConfig.routerUrl + "/api2/",
    typedApiSchema
  );

  beforeAll(async () => {
    closeable = await main(globalConfig.routerPort);
  });

  afterAll(async () => {
    await closeable.close();
  });

  beforeEach(async () => {
    await initTestDb();
  });

  afterEach(async () => {
    await prisma.$disconnect();
    jest.resetAllMocks();
  });

  it("works", async () => {
    await setupMockSession();
    const res = await client.post("createApplication", { name: "foo" });
    expect(res.secret).toBeDefined();
  });

  it("requires name", async () => {
    try {
      const res = await client.post("createApplication", {} as any);
      fail();
    } catch (err) {
      // TODO refine error message
      expect(err.message).toStrictEqual("Invalid request");
    }
  });

  it("requires session", async () => {
    try {
      const res = await client.post("createApplication", { name: "foo" });
      fail();
    } catch (err) {
      expect(err.message).toBe("Not logged in");
    }
  });

  it("ensures name is unique", async () => {
    await setupMockSession();
    const res = await client.post("createApplication", { name: "foo" });

    try {
      const res2 = await client.post("createApplication", { name: "foo" });
      fail();
    } catch (err) {
      expect(err.message).toStrictEqual(
        "An application with the same name already exists."
      );
    }
  });
});
