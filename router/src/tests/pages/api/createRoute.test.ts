import { Closeable } from "dev-in-prod-lib/src/appServer";
import { globalConfig } from "dev-in-prod-lib/src/globalConfig";
import { main } from "../../../../main";
import { prisma } from "../../../prisma";
// TODO fix import
import { TypedClient } from "../../../typedApi/httpClient";
import { initTestDb } from "../../db";
import { setupMockSession } from "../../testLib";
import { typedApiSchema } from "../../../typedApiSchema";
jest.mock("next-auth/client");

describe("createRoute", () => {
  let closeable: Closeable;

  const client = new TypedClient(
    globalConfig.routerUrl + "/api2/",
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

  it("requires valid application secret", async () => {
    await setupMockSession();
    const res = await client.post("createRoute", { applicationSecret: "foo" });
    expect(res.response?.status).toBe(400);
    if (res.success) {
      fail();
    } else {
      expect(res.error).toBe("Invalid application secret");
    }
  });

  it("requires session", async () => {
    const res = await client.post("createRoute", { applicationSecret: "foo" });
    expect(res.response?.status).toBe(401);
    if (res.success) {
      fail();
    } else {
      expect(res.error).toBe("Not logged in");
    }
  });

  it("works", async () => {
    await setupMockSession();
    try {
      const res = await client.post("createApplication", {
        name: "foo",
      });
    } catch (e) {
      console.error("VDSFSD", e);
    }
    try {
      const res1 = await fetch("http://localhost:3000/api/createRoute");
      console.log("ASDFASDF", res1);
    } catch (e) {
      console.error("BFDBDFGB", e);
    }
    // const res = await client.post("createApplication", {
    //   name: "foo",
    // });
    // if (res.success) {
    //   const secret = res.parsedBody.secret;
    //   const res2 = await client.post("createRoute", {
    //     applicationSecret: secret,
    //   });
    //   if (res2.success) {
    //     const routeKey = res2.parsedBody.routeKey;
    //     console.log(routeKey);
    //   } else {
    //     fail();
    //   }
    // } else {
    //   fail();
    // }
  });
});