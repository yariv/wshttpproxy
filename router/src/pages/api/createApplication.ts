import { authorize } from "../../middleware";
import { typedApiSchema } from "../../typedApiSchema";
import { createHandler, ApiHttpError } from "../../typedApi/server";
import { prisma } from "../../prisma";
import { genNewToken } from "../../utils";

export default createHandler(
  typedApiSchema,
  "createApplication",
  async (req) => {
    const session = await authorize(req);

    const ownerId = (session.user as any).id;
    const application = await prisma.application.findUnique({
      where: {
        ownerId_name: {
          ownerId: ownerId,
          name: req.parsedBody.name,
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
        name: req.parsedBody.name,
        owner: { connect: { id: ownerId } },
        secret,
      },
    });

    return { secret };
  }
);
