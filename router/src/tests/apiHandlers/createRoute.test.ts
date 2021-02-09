import { getRouterApiUrl, globalConfig } from "dev-in-prod-lib/src/utils";
import { setupTest } from "dev-in-prod-lib/src/testLib";
import { TypedHttpClient } from "typed-api/src/httpApi";
import { routerApiSchema } from "dev-in-prod-lib/dist/routerApiSchema";
import { routerMain } from "dev-in-prod-router/routerMain";
jest.mock("next-auth/client");

describe("createRoute", () => {
  const defer = setupTest();
  const client = new TypedHttpClient(getRouterApiUrl(), routerApiSchema);
  beforeAll(async () => {
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
