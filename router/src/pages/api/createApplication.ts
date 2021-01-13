import { PrismaClient } from "@prisma/client";
import { getPrismaClient } from "@prisma/client/runtime";
import type { NextApiRequest, NextApiResponse } from "next";
import { getSession } from "next-auth/client";
import * as z from "zod";

const args = z.object({
  name: z.string(),
});

type Res = {
  userId: string;
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

  await prisma.application.findUnique({
    where: {
      ownerId_name: {
        ownerId: (session.user as any).id,
        name: reqBody.name,
      },
    },
  });
}
