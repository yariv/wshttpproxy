import { Closeable } from "dev-in-prod-lib/src/appServer";
import { globalConfig } from "dev-in-prod-lib/src/globalConfig";
import { main } from "../../../../main";
import { prisma } from "../../../prisma";
// TODO fix import
import { TypedHttpClient } from "../../../typedApi/httpApi";
import { initTestDb } from "../../db";
import { setupMockSession } from "../../testLib";
import { typedApiSchema } from "../../../typedApiSchema";
jest.mock("next-auth/client");

describe("createRoute", () => {
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

  it("requires valid application secret", async () => {
    await setupMockSession();
    try {
      const res = await client.post("createRoute", {
        applicationSecret: "foo",
      });
      fail();
    } catch (err) {
      expect(err.message).toBe("Invalid application secret");
    }
  });

  it("requires session", async () => {
    try {
      const res = await client.post("createRoute", {
        applicationSecret: "foo",
      });
      fail();
    } catch (err) {
      expect(err.message).toBe("Not logged in");
    }
  });

  it("works", async () => {
    await setupMockSession();
    const res = await client.post("createApplication", {
      name: "foo",
    });

    debugger;
    const secret = res.secret;
    const res2 = await client.post("createRoute", {
      applicationSecret: secret,
    });
    expect(res2.routeKey.length).toBe(6);
  });
});
