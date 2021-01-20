import util from "util";
import { initTestDb } from "../../db";
import { prisma } from "../../../prisma";
import { setupMockSession } from "../../testLib";
import { main } from "../../../../main";
import { globalConfig } from "dev-in-prod-lib/src/globalConfig";
jest.mock("next-auth/client");

const callApi = async (methodName: string, body: any): Promise<any> => {
  const res = await fetch(globalConfig.routerUrl + "/api/" + methodName, {
    method: "POST",
    body: JSON.stringify({ name: "foo" }),
    headers: { "content-type": "application/json" },
  });
  return await res.json();
};

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

    const res = await callApi("createApplication", { name: "foo" });
    console.log(res);
    await cloesable.close();
  });
});
