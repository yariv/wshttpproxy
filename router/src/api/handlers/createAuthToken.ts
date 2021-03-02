import { routerApiSchema } from "dev-in-prod-lib/src/routerApiSchema";
import { Request } from "koa";
import { createKoaRoute } from "typed-api/src/koaAdapter";
import { prisma } from "../../prisma";
import { createOAuthToken } from "../../utils";

const clientId = "test_client";

// Useful for integration tests
export const createAuthTokenHandler = createKoaRoute(
  routerApiSchema,
  "createAuthToken",
  async (body, req: Request) => {
    if (!req.socket.remoteAddress?.endsWith("127.0.0.1")) {
      throw new Error("This endpoint is only callable from localhost.");
    }
    const oauthToken = await createOAuthToken();
    return { oauthToken };
  }
);
