import { genNewToken } from "dev-in-prod-lib/src/utils";
import { IncomingMessage } from "http";
import { Request } from "koa";
import { authorize } from "../middleware";
import { prisma } from "../prisma";
import { createKoaRoute } from "../typedApi/koaAdapter";
import { ApiHttpError } from "../typedApi/types";
import { typedApiSchema } from "../typedApiSchema";

export const createApplicationHandler = createKoaRoute(
  typedApiSchema,
  "createApplication",
  async (body, req: Request) => {
    const ownerId = await authorize(req.method, body.oauthToken);

    const application = await prisma.application.findUnique({
      where: {
        ownerId_name: {
          ownerId: ownerId,
          name: body.name,
        },
      },
    });
    if (application) {
      throw new ApiHttpError(
        "An application with the same name already exists.",
        400
      );
    }

    const secret = genNewToken();
    await prisma.application.create({
      data: {
        name: body.name,
        owner: { connect: { id: ownerId } },
        secret,
      },
    });

    return { secret };
  }
);
