import { PrismaClient } from "@prisma/client";
import type { NextApiRequest, NextApiResponse } from "next";
import { getSession } from "next-auth/client";
import * as z from "zod";
import { genNewToken } from "../../utils";

const args = z.object({
  name: z.string(),
});

type Res = {
  secret: string;
};

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse<Res>
) {
  if (req.method != "POST") {
    res.status(405).end();
    return;
  }

  const session = await getSession({ req });
  if (!session) {
    res.status(401).end();
    return;
  }

  const reqBody = args.parse(req.body);

  const prisma = new PrismaClient();

  const ownerId = (session.user as any).id;
  const application = await prisma.application.findUnique({
    where: {
      ownerId_name: {
        ownerId: ownerId,
        name: reqBody.name,
      },
    },
  });

  if (application) {
    res.write("An application with the same name already exists.");
    res.status(400).end();
    return;
  }

  const secret = genNewToken();
  await prisma.application.create({
    data: {
      name: reqBody.name,
      owner: { connect: { id: ownerId } },
      secret,
    },
  });
  res.status(200).json({ secret });
}
