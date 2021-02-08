import { routerApiSchema } from "../routerApiSchema";
import { createKoaRoute } from "../typedApi/koaAdapter";
import { Request } from "koa";
import { prisma } from "../prisma";
import { createOAuthToken } from "../utils";

const clientId = "test_client";

// Useful for integration tests
export const createRouteHandler = createKoaRoute(
  routerApiSchema,
  "createTestOAuthToken",
  async (body, req: Request) => {
    if (process.env.NODE_ENV !== "test") {
      throw new Error("This endpoint is only available for tests.");
    }
    const user = await prisma.user.create({ data: {} });
    const oauthToken = await createOAuthToken(user.id, clientId);
    return { oauthToken };
  }
);
