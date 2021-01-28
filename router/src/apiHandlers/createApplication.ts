import { IncomingMessage } from "http";
import { authorize } from "../middleware";
import { prisma } from "../prisma";
import { createHttpHandler } from "../typedApi/httpApi";
import { ApiHttpError } from "../typedApi/types";
import { typedApiSchema } from "../typedApiSchema";
import { genNewToken } from "../utils";

export const createApplicationHandler = createHttpHandler(
  typedApiSchema,
  "createApplication",
  async (body, req: IncomingMessage) => {
    const session = await authorize(req);

    const ownerId = session.user.id;
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
