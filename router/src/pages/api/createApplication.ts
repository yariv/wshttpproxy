import type { NextApiRequest, NextApiResponse } from "next";
import { getSession, Session } from "next-auth/client";
import { ReqSchema, ResSchema } from "../../apiSchema";
import { prisma } from "../../prisma";
import { createHandler } from "../../typedApiHandler";
import { genNewToken } from "../../utils";

export default createHandler("createApplication", async (req, res) => {
  if (req.method != "POST") {
    res.status(405).end();
    return;
  }

  const session = await getSession({ req });
  if (!session) {
    res.status(401).json({ error: "Not logged in" });
    res.end();
    return;
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
    res.status(400).write("An application with the same name already exists.");
    res.end();
    return;
  }

  const secret = genNewToken();
  await prisma.application.create({
    data: {
      name: req.parsedBody.name,
      owner: { connect: { id: ownerId } },
      secret,
    },
  });
  res.status(200).json({ secret });
});
