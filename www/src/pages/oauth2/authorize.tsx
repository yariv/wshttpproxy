import { GetServerSideProps, GetServerSidePropsContext } from "next";
import {
  useSession,
  getSession,
  signIn,
  signOut,
  session,
  Session,
} from "next-auth/client";
import { oauthTokenRepository } from "../../entity/oauthToken";
import { strict as assert } from "assert";
import { UserWithId } from "../api/auth/[...nextauth]";
import { genNewToken } from "../../utils";
import * as React from "react";
import * as z from "zod";
import { ObjectType } from "typeorm";
import { url } from "koa-router";

export default function Page() {
  const [session, loading] = useSession();

  if (typeof window !== "undefined" && loading) return null;

  if (!session)
    return (
      <div>
        <p>Access Denied</p>
        <button onClick={() => signIn()}>Sign In</button>
      </div>
    );
  return (
    <>
      <h1>Protected Page</h1>
      <p>You can view this page because you are signed in.</p>
      <button onClick={() => signOut()}>Sign out</button>
    </>
  );
}

const args = z.object({
  response_type: z.literal("token"),
  scope: z.literal("proxy"),
  redirect_uri: z.string().url(),
  client_id: z.string(),
});

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const { client_id, redirect_uri } = args.parse(ctx.query);

  const session = await getSession(ctx);

  if (!session) {
    return { props: {} };
  }

  const userId = (session.user as UserWithId).id;
  const oauthToken = await oauthTokenRepository().findOne({
    where: { clientId: client_id, userId: userId },
  });

  let token;
  if (oauthToken) {
    token = oauthToken.token;
  } else {
    token = genNewToken();
    oauthTokenRepository().create({
      token: token,
      clientId: client_id,
      userId: userId,
    });
  }
  const redirectUrl = new URL(redirect_uri);
  redirectUrl.hash = "token=" + token;
  return {
    redirect: { destination: redirectUrl.toString(), permanent: false },
  };
};
