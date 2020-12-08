import { NextApiRequest } from "next";
import NextAuth, { InitOptions, User } from "next-auth";
import Providers from "next-auth/providers";
import { NextApiResponse } from "next-auth/_utils";
import { googleConfig } from "../../../gapi";

const dbConfig = require("../../../../ormconfig.json");

// type UserWithId = User & { id: string };

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
  // SQL or MongoDB database (or leave empty)
  database: dbConfig,
  // callbacks: {
  //   session: async (session, user) => {
  //     (session.user as UserWithId).id = (user as UserWithId).id;
  //     return Promise.resolve(session);
  //   },
  // },
};

export default (req: NextApiRequest, res: NextApiResponse) =>
  NextAuth(req, res, options);
