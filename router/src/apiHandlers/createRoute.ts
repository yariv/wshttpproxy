import { IncomingMessage } from "http";
import ShortUniqueId from "short-unique-id";
import { authorize } from "../middleware";
import { prisma } from "../prisma";
import { createHttpHandler } from "../typedApi/server";
import { ApiHttpError } from "../typedApi/types";
import { typedApiSchema } from "../typedApiSchema";

export const createRouteHandler = createHttpHandler(
  typedApiSchema,
  "createRoute",
  async (body, req: IncomingMessage) => {
    const session = await authorize(req);
    const secret = body.applicationSecret;
    const application = await prisma.application.findUnique({
      where: { secret: secret },
    });
    if (!application) {
      throw new ApiHttpError("Invalid application secret", 400);
    }
    const routeKey = new ShortUniqueId().toString();
    await prisma.route.create({
      data: {
        key: routeKey,
        owner: {
          connect: {
            id: session.user.id,
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
