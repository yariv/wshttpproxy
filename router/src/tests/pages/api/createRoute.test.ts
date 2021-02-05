import { createTestOAuthToken } from "../../testLib";
import { setupTest } from "../../testLib";
jest.mock("next-auth/client");

describe("createRoute", () => {
  const client = setupTest();

  it("requires valid application secret", async () => {
    const oauthToken = await createTestOAuthToken();
    try {
      await client.post("createRoute", {
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
