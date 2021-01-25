import { Closeable } from "dev-in-prod-lib/src/appServer";
import { globalConfig } from "dev-in-prod-lib/src/globalConfig";
import { main } from "../../../../main";
import { prisma } from "../../../prisma";
import { TypedClient } from "typed-api/src/client";
import { initTestDb } from "../../db";
import { setupMockSession } from "../../testLib";
import { typedApiSchema } from "../../../typedApiSchema";
jest.mock("next-auth/client");

describe("createApplication", () => {
  let closeable: Closeable;

  const client = new TypedClient(
    globalConfig.routerUrl + "/api/",
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
    expect(res.response.status).toBe(200);
    if (res.success) {
      expect(res.parsedBody.secret).toBeDefined();
    } else {
      fail();
    }
  });

  it("requires name", async () => {
    const res = await client.post("createApplication", {} as any);
    expect(res.response.status).toBe(400);
    if (res.success) {
      fail();
    } else {
      expect(res.error).toStrictEqual({
        errors: [
          {
            code: "invalid_type",
            expected: "string",
            received: "undefined",
            path: ["name"],
            message: "Required",
          },
        ],
      });
    }
  });

  it("requires session", async () => {
    const res = await client.post("createApplication", { name: "foo" });
    if (res.success) {
      fail();
    } else {
      expect(res.response.status).toBe(401);
      expect(res.error).toBe("Not logged in");
    }
  });

  it("ensures name is unique", async () => {
    await setupMockSession();
    const res = await client.post("createApplication", { name: "foo" });
    if (!res.success) {
      fail();
    }

    const res2 = await client.post("createApplication", { name: "foo" });
    if (res2.success) {
      fail();
    } else {
      expect(res2.response.status).toBe(400);
      expect(res2.error).toStrictEqual(
        "An application with the same name already exists."
      );
    }
  });
});
