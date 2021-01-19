import util from "util";
import { initTestDb } from "../../db";
import { prisma } from "../../../prisma";
import { setupMockSession } from "../../testLib";
import { main } from "../../../../main";
import { globalConfig } from "dev-in-prod-lib/src/globalConfig";
jest.mock("next-auth/client");

describe("createApplication works", () => {
  // console.log(3);
  beforeAll(async () => {
    await initTestDb();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("works", async () => {
    await setupMockSession();
    const cloesable = await main(globalConfig.routerPort);

    const res = await fetch("/api/createApplication", {
      method: "POST",
      body: JSON.stringify({ name: "foo" }),
    });
    await cloesable.close();
  });
});
