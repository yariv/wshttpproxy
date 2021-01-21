import { Closeable } from "dev-in-prod-lib/src/appServer";
import { globalConfig } from "dev-in-prod-lib/src/globalConfig";
import { main } from "../../../../main";
import { prisma } from "../../../prisma";
import { TypedClient } from "../../../../../typedApi/src/typedApiClient";
import { initTestDb } from "../../db";
import { setupMockSession } from "../../testLib";
jest.mock("next-auth/client");

describe("createApplication", () => {
  let closeable: Closeable;

  const client = new TypedClient(globalConfig.routerUrl + "/api/");

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
    expect(res.status).toBe(200);
    expect(res.parsedBody?.secret).toBeDefined();
    expect(res.error).toBeUndefined();
  });

  it("requires name", async () => {
    const res = await client.post("createApplication", {} as any);
    expect(res.status).toBe(400);
    expect(res.parsedBody).toBeUndefined();
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
  });

  it("requires session", async () => {
    const res = await client.post("createApplication", { name: "foo" });
    expect(res.status).toBe(401);
    expect(res.error).toBe("Not logged in");
  });

  it("ensures name is unique", async () => {
    await setupMockSession();
    const res = await client.post("createApplication", { name: "foo" });
    expect(res.status).toBe(200);

    const res2 = await client.post("createApplication", { name: "foo" });
    expect(res2.status).toBe(400);
  });
});
