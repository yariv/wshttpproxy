import { getSession } from "next-auth/client";
import { HttpError, createHandler } from "typed-api/src/server";
import { typedApiSchema } from "../../../typedApiSchema";
import { prisma } from "../../prisma";
import { genNewToken } from "../../utils";

export default createHandler(
  typedApiSchema,
  "createApplication",
  async (req) => {
    if (req.method != "POST") {
      throw new HttpError({ status: 405 });
    }

    const session = await getSession({ req });
    if (!session) {
      throw new HttpError({ message: "Not logged in", status: 401 });
    }

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
      throw new HttpError({
        message: "An application with the same name already exists.",
        status: 400,
      });
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
