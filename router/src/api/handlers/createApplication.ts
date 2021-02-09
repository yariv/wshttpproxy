import { routerApiSchema } from "dev-in-prod-lib/dist/routerApiSchema";
import { genNewToken } from "dev-in-prod-lib/dist/utils";
import { Request } from "koa";
import { createKoaRoute } from "typed-api/src/koaAdapter";
import { ApiHttpError } from "typed-api/src/types";
import { authorize } from "../authorize";
import { prisma } from "../../prisma";

export const createApplicationHandler = createKoaRoute(
  routerApiSchema,
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
