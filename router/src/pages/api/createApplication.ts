import { authorize } from "../../middleware";
import { typedApiSchema } from "../../typedApiSchema";
import { ApiHttpError } from "../../typedApi/types";
import { prisma } from "../../prisma";
import { genNewToken } from "../../utils";
import { createNextHandler } from "../../typedApi/nextServer";

export default createNextHandler(
  typedApiSchema,
  "createApplication",
  async (body, req) => {
    const session = await authorize(req);

    const ownerId = (session.user as any).id;
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
