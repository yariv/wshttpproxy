import { authorize } from "src/middleware";
import { prisma } from "src/prisma";
import { typedApiSchema } from "src/typedApiSchema";
import { createHandler, ApiHttpError } from "typed-api/src/server";

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
  const route = await prisma.route.create({
    data: { shortId: null, owner: null, application: null },
  });
  application?.createdAt;
});
