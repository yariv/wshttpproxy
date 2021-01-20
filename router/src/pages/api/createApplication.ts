import type { NextApiRequest, NextApiResponse } from "next";
import { Session } from "next-auth/client";
import { ReqSchema, ResSchema } from "../../apiSchema";
import { prisma } from "../../prisma";
import { createHandler } from "../../typedApiHandler";
import { genNewToken } from "../../utils";

export default createHandler("createApplication", async (req, res, session) => {
  const ownerId = (session.user as any).id;
  const application = await prisma.application.findUnique({
    where: {
      ownerId_name: {
        ownerId: ownerId,
        name: req.validatedBody.name,
      },
    },
  });

  if (application) {
    res.status(400).write("An application with the same name already exists.");
    res.status(400).end();
    return;
  }

  const secret = genNewToken();
  await prisma.application.create({
    data: {
      name: req.validatedBody.name,
      owner: { connect: { id: ownerId } },
      secret,
    },
  });
  res.status(200).json({ secret });
});
