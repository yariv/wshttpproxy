import { getRouterApiUrl, globalConfig } from "dev-in-prod-lib/src/utils";
import { routerMain } from "../../../../routerMain";
import { routerApiSchema } from "../../../routerApiSchema";
import { TypedHttpClient } from "../../../typedApi/httpApi";
import { createTestOAuthToken } from "dev-in-prod-lib/src/testLib";
import { setupTest } from "dev-in-prod-lib/src/testLib";

describe("createApplication", () => {
  const defer = setupTest();
  const client = new TypedHttpClient(getRouterApiUrl(), routerApiSchema);
  beforeAll(async () => {
    defer(await routerMain(globalConfig.routerPort));
  });

  it("works", async () => {
    const oauthToken = await createTestOAuthToken();
    const res = await client.post("createApplication", {
      oauthToken,
      name: "foo",
    });
    expect(res.secret).toBeDefined();
  });

  it("requires name", async () => {
    const oauthToken = await createTestOAuthToken();
    try {
      const res = await client.post("createApplication", { oauthToken } as any);
      fail();
    } catch (err) {
      // TODO refine error message
      expect(err.message).toStrictEqual("Invalid request");
    }
  });

  it("requires oauth token", async () => {
    try {
      const res = await client.post("createApplication", {
        name: "foo",
      } as any);
      fail();
    } catch (err) {
      expect(err.message).toBe("Invalid request");
    }
  });

  it("requires valid oauth token", async () => {
    try {
      const res = await client.post("createApplication", {
        oauthToken: "foo",
        name: "foo",
      });
      fail();
    } catch (err) {
      expect(err.message).toBe("Invalid oauth token");
    }
  });

  it("ensures name is unique", async () => {
    const oauthToken = await createTestOAuthToken();
    const res = await client.post("createApplication", {
      oauthToken,
      name: "foo",
    });

    try {
      const res2 = await client.post("createApplication", {
        oauthToken,
        name: "foo",
      });
      fail();
    } catch (err) {
      expect(err.message).toStrictEqual(
        "An application with the same name already exists."
      );
    }
  });
});
