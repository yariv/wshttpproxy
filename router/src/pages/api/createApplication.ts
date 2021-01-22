import { getSession } from "next-auth/client";
import { prisma } from "../../prisma";
import { createHandler, HttpError } from "typedApi/src/typedApiHandler";
import { genNewToken, log } from "../../utils";

export default createHandler("createApplication", async (req) => {
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
});
