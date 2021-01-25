import { authorize } from "src/middleware";
import { prisma } from "src/prisma";
import { typedApiSchema } from "src/typedApiSchema";
import { createHandler, ApiHttpError } from "typed-api/src/server";
import ShortUniqueId from "short-unique-id";

export default createHandler(typedApiSchema, "createRoute", async (req) => {
  const session = await authorize(req);
  const secret = req.parsedBody.applicationSecret;
  const application = await prisma.application.findUnique({
    where: { secret: secret },
  });
  if (!application) {
    throw new ApiHttpError({
      message: "Invalid application secret",
      status: 400,
    });
  }
  const routeKey = new ShortUniqueId().toString();
  const route = await prisma.route.create({
    data: {
      key: routeKey,
      owner: {
        connect: {
          id: 1,
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
    key: routeKey,
  };
});
