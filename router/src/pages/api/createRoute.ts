import { authorize } from "../../middleware";
import { prisma } from "../../prisma";
import { typedApiSchema } from "../../typedApiSchema";
import { createHandler, ApiHttpError } from "../../typedApi/server";
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
    routeKey,
  };
});
