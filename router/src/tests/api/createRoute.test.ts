import { getRouterApiUrl, globalConfig } from "dev-in-prod-lib/dist/utils";
import { routerMain } from "../../../routerMain";
import { setupTest } from "dev-in-prod-lib/dist/testLib";
import { TypedHttpClient } from "typed-api/src/httpApi";
import { routerApiSchema } from "dev-in-prod-lib/dist/routerApiSchema";
import { initTestDb } from "../db";
import { prisma } from "../../prisma";
jest.mock("next-auth/client");

describe("createRoute", () => {
  const defer = setupTest();
  defer(prisma.$disconnect.bind(prisma));
  const client = new TypedHttpClient(getRouterApiUrl(), routerApiSchema);
  beforeAll(async () => {
    initTestDb();
    defer(await routerMain(globalConfig.routerPort));
  });

  it("requires valid application secret", async () => {
    const { oauthToken } = await client.call("createTestOAuthToken");
    try {
      await client.call("createRoute", {
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
      const res = await client.call("createRoute", {
        oauthToken: "foo",
        applicationSecret: "foo",
      });
      fail();
    } catch (err) {
      expect(err.message).toBe("Invalid oauth token");
    }
  });

  it("works", async () => {
    const { oauthToken } = await client.call("createTestOAuthToken");
    const res = await client.call("createApplication", {
      oauthToken,
      name: "foo",
    });

    const secret = res.secret;
    const res2 = await client.call("createRoute", {
      oauthToken,
      applicationSecret: secret,
    });
    expect(res2.routeKey.length).toBe(6);
  });
});
