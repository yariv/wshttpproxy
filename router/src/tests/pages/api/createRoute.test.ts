import { Closeable } from "dev-in-prod-lib/src/appServer";
import { getRouterApiUrl, globalConfig } from "dev-in-prod-lib/src/utils";
import { main } from "../../../../main";
import { prisma } from "../../../prisma";
// TODO fix import
import { TypedHttpClient } from "../../../typedApi/httpApi";
import { initTestDb } from "../../db";
import { createTestOAuthToken } from "../../testLib";
import { typedApiSchema } from "../../../typedApiSchema";
jest.mock("next-auth/client");

describe("createRoute", () => {
  let closeable: Closeable;

  const client = new TypedHttpClient(getRouterApiUrl(), typedApiSchema);

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
    const oauthToken = await createTestOAuthToken();
    try {
      const res = await client.post("createRoute", {
        oauthToken,
        applicationSecret: "foo",
      });
      fail();
    } catch (err) {
      expect(err.message).toBe("Invalid application secret");
    }
  });

  it("requires valid oauthToken", async () => {
    try {
      const res = await client.post("createRoute", {
        oauthToken: "foo",
        applicationSecret: "foo",
      });
      fail();
    } catch (err) {
      expect(err.message).toBe("Invalid oauth token");
    }
  });

  it("works", async () => {
    const oauthToken = await createTestOAuthToken();
    const res = await client.post("createApplication", {
      oauthToken,
      name: "foo",
    });

    const secret = res.secret;
    const res2 = await client.post("createRoute", {
      oauthToken,
      applicationSecret: secret,
    });
    expect(res2.routeKey.length).toBe(6);
  });
});
