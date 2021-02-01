import { Closeable } from "dev-in-prod-lib/src/appServer";
import { getRouterApiUrl, globalConfig } from "dev-in-prod-lib/src/utils";
import { main } from "../../../../main";
import { prisma } from "../../../prisma";
import { TypedHttpClient } from "../../../typedApi/httpApi";
import { initTestDb } from "../../db";
import { createTestOAuthToken } from "../../testLib";
import { typedApiSchema } from "../../../typedApiSchema";
jest.mock("next-auth/client");

describe("createApplication", () => {
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
