import { PrismaClient } from "@prisma/client";
import { NextApiRequest, NextApiResponse } from "next";
import NextAuth, { InitOptions } from "next-auth";
import Adapters from "next-auth/adapters";
import Providers from "next-auth/providers";
import { googleConfig } from "../../../gapi";
import { prisma } from "../../../prisma";

const options: InitOptions = {
  providers: [
    // OAuth authentication providers
    // Providers.Apple({
    //   clientId: process.env.APPLE_ID as string,
    //   clientSecret: process.env.APPLE_SECRET,
    // }),
    Providers.Google({
      clientId: googleConfig.client_id,
      clientSecret: googleConfig.client_secret,
    }),
    // Sign in with passwordless email link
    Providers.Email({
      server: process.env.MAIL_SERVER,
      from: "<no-reply@example.com>",
    }),
  ],
  adapter: Adapters.Prisma.Adapter({ prisma }),
};

const NextAuthPage = (req: NextApiRequest, res: NextApiResponse) =>
  NextAuth(req, res, options);
export default NextAuthPage;
