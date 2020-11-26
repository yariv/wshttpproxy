import { NextApiRequest } from "next";
import NextAuth from "next-auth";
import Providers from "next-auth/providers";
import { NextApiResponse } from "next-auth/_utils";
import { googleConfig } from "../../../gapi";

const dbConfig = require("../../../../ormconfig.json");

const options = {
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
};

export default (req: NextApiRequest, res: NextApiResponse) =>
  NextAuth(req, res, options);
