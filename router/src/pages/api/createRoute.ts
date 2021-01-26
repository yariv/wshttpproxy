import { authorize } from "../../middleware";
import { prisma } from "../../prisma";
import { typedApiSchema } from "../../typedApiSchema";
import { createNextHandler } from "../../typedApi/nextServer";
import ShortUniqueId from "short-unique-id";

export default (req: any, res: any) => {
  res.status(200).write("foo");
  res.end();
};
// export default createHandler(typedApiSchema, "createRoute", async (req) => {
//   const session = await authorize(req);
//   const secret = req.parsedBody.applicationSecret;
//   const application = await prisma.application.findUnique({
//     where: { secret: secret },
//   });
//   if (!application) {
//     throw new ApiHttpError("Invalid application secret", 400);
//   }
//   const routeKey = new ShortUniqueId().toString();
//   await prisma.route.create({
//     data: {
//       key: routeKey,
//       owner: {
//         connect: {
//           id: 1,
//         },
//       },
//       application: {
//         connect: {
//           id: application.id,
//         },
//       },
//     },
//   });

//   return {
//     routeKey,
//   };
// });
