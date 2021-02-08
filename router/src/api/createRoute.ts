import { Request } from "koa";
import ShortUniqueId from "short-unique-id";
import { authorize } from "../middleware";
import { prisma } from "../prisma";
import { createKoaRoute } from "../typedApi/koaAdapter";
import { ApiHttpError } from "../typedApi/types";
import { routerApiSchema } from "../routerApiSchema";

export const createRouteHandler = createKoaRoute(
  routerApiSchema,
  "createRoute",
  async (body, req: Request) => {
    const userId = await authorize(req.method, body.oauthToken);

    // TODO replace with routingSecret
    const secret = body.applicationSecret;
    const application = await prisma.application.findUnique({
      where: { secret: secret },
    });
    if (!application) {
      throw new ApiHttpError("Invalid application secret", 400);
    }
    const routeKey = new ShortUniqueId().randomUUID();
    await prisma.route.create({
      data: {
        key: routeKey,
        owner: {
          connect: {
            id: userId,
          },
        },
        application: {
          connect: {
            id: application.id,
          },
        },
      },
    });

    return {
      routeKey,
    };
  }
);
