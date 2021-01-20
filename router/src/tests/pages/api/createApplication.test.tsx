import { Closeable } from "dev-in-prod-lib/src/appServer";
import { globalConfig } from "dev-in-prod-lib/src/globalConfig";
import { main } from "../../../../main";
import { prisma } from "../../../prisma";
import { callApi } from "../../../typedApiClient";
import { initTestDb } from "../../db";
import { setupMockSession } from "../../testLib";
jest.mock("next-auth/client");

describe("createApplication works", () => {
  let closeable: Closeable;

  beforeEach(async () => {
    await initTestDb();
    closeable = await main(globalConfig.routerPort);
  });

  afterEach(async () => {
    await prisma.$disconnect();
    await closeable.close();
  });

  it("works", async () => {
    await setupMockSession();
    const res = await callApi("createApplication", { name: "foo" });
    expect(res.status).toBe(200);
    expect(res.parsedBody?.secret).toBeDefined();
    expect(res.error).toBeUndefined();
  });

  it("requires name", async () => {
    await setupMockSession();
    const res = await callApi("createApplication", {} as any);
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

  it("ensures name is unique", async () => {
    await setupMockSession();
    const res = await callApi("createApplication", { name: "foo" });
    expect(res.status).toBe(200);

    const res2 = await callApi("createApplication", { name: "foo" });
    expect(res2.status).toBe(400);
  });
});
