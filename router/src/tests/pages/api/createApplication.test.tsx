import { Closeable } from "dev-in-prod-lib/src/appServer";
import { globalConfig } from "dev-in-prod-lib/src/globalConfig";
import { main } from "../../../../main";
import { prisma } from "../../../prisma";
import { callApi } from "../../../typedApiClient";
import { initTestDb } from "../../db";
import { setupMockSession } from "../../testLib";
jest.mock("next-auth/client");

describe("createApplication works", () => {
  // console.log(3);
  let closeable: Closeable;

  beforeEach(async () => {
    await initTestDb();
    closeable = await main(globalConfig.routerPort);
  });

  afterEach(async () => {
    await prisma.$disconnect();
    await closeable.close();
  });

  // it("works", async () => {
  //   await setupMockSession();
  //   const res = await callApi("createApplication", { name: "foo" });
  //   expect(res).not.toBeNull();
  // });

  it("requires name", async () => {
    await setupMockSession();
    const res = await callApi("createApplication", {} as any);
    expect(res.status).toBe(400);
    expect(res.parsedBody).toBeUndefined();
  });
});
