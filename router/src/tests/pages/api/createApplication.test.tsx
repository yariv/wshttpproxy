import util from "util";
import { initTestDb } from "../../db";
import { prisma } from "../../../prisma";
import { setupMockSession } from "../../testLib";
import { main } from "../../../../main";
import { globalConfig } from "dev-in-prod-lib/src/globalConfig";
jest.mock("next-auth/client");

describe("createApplication works", () => {
  // console.log(3);
  beforeEach(async () => {
    await initTestDb();
  });

  afterEach(async () => {
    await prisma.$disconnect();
  });

  it("works", async () => {
    await setupMockSession();
    const cloesable = await main(globalConfig.routerPort);

    const res = await fetch(globalConfig.routerUrl + "/api/createApplication", {
      method: "POST",
      body: JSON.stringify({ name: "foo" }),
      headers: { "content-type": "application/json" },
    });
    await cloesable.close();
    await prisma.$disconnect();
  });
});
