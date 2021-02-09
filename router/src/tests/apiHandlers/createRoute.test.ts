import { routerApiSchema } from "dev-in-prod-lib/src/routerApiSchema";
import { setupTest } from "dev-in-prod-lib/src/testLib";
import { TypedHttpClient } from "typed-api/src/httpApi";
import { setupRouterTest } from "../utils";
jest.mock("next-auth/client");

describe("createRoute", () => {
  let client: TypedHttpClient<typeof routerApiSchema>;
  const defer = setupTest();

  beforeAll(async () => {
    const { client: client1 } = await setupRouterTest(defer);
    client = client1;
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
