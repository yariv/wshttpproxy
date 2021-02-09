import { getRouterApiUrl, globalConfig } from "dev-in-prod-lib/dist/utils";
import { routerMain } from "../../../routerMain";
import { setupTest } from "dev-in-prod-lib/dist/testLib";
import { routerApiSchema } from "dev-in-prod-lib/dist/routerApiSchema";
import { TypedHttpClient } from "typed-api/src/httpApi";
import { prisma } from "../../prisma";
import { initTestDb } from "../db";

describe("createApplication", () => {
  const defer = setupTest();
  defer(prisma.$disconnect.bind(prisma));

  const client = new TypedHttpClient(getRouterApiUrl(), routerApiSchema);
  beforeAll(async () => {
    initTestDb();
    defer(await routerMain(globalConfig.routerPort));
  });

  it("works", async () => {
    const { oauthToken } = await client.call("createTestOAuthToken");
    const res = await client.call("createApplication", {
      oauthToken,
      name: "foo",
    });
    expect(res.secret).toBeDefined();
  });

  it("requires name", async () => {
    const { oauthToken } = await client.call("createTestOAuthToken");
    try {
      const res = await client.call("createApplication", { oauthToken } as any);
      fail();
    } catch (err) {
      // TODO refine error message
      expect(err.message).toStrictEqual("Invalid request");
    }
  });

  it("requires oauth token", async () => {
    try {
      const res = await client.call("createApplication", {
        name: "foo",
      } as any);
      fail();
    } catch (err) {
      expect(err.message).toBe("Invalid request");
    }
  });

  it("requires valid oauth token", async () => {
    try {
      const res = await client.call("createApplication", {
        oauthToken: "foo",
        name: "foo",
      });
      fail();
    } catch (err) {
      expect(err.message).toBe("Invalid oauth token");
    }
  });

  it("ensures name is unique", async () => {
    const { oauthToken } = await client.call("createTestOAuthToken");
    const res = await client.call("createApplication", {
      oauthToken,
      name: "foo",
    });

    try {
      const res2 = await client.call("createApplication", {
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
