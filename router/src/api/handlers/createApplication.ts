import { routerApiSchema } from "dev-in-prod-lib/src/routerApiSchema";
import { genNewToken } from "dev-in-prod-lib/src/utils";
import { Request } from "koa";
import { createKoaRoute } from "typed-api/src/koaAdapter";
import { ApiHttpError } from "typed-api/src/types";
import { authorize } from "../authorize";
import { prisma } from "../../prisma";

export const createApplicationHandler = createKoaRoute(
  routerApiSchema,
  "createApplication",
  async ({ name, oauthToken }, req: Request) => {
    const ownerId = await authorize(req.method, oauthToken);

    const application = await prisma.application.findUnique({
      where: {
        ownerId_name: {
          ownerId: ownerId,
          name,
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
        name,
        owner: { connect: { id: ownerId } },
        secret,
      },
    });

    return { secret };
  }
);
