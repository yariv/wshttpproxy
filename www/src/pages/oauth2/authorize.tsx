import { GetServerSideProps } from "next";
import { getSession, signIn, signOut, useSession } from "next-auth/client";
import * as React from "react";
import * as z from "zod";
import { oauthTokenRepository } from "../../entity/oauthToken";
import { log } from "../../log";
import { genNewToken } from "../../utils";
import { UserWithId } from "../api/auth/[...nextauth]";
import { createHash } from "crypto";
import { getConnection } from "typeorm";

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

  const token = genNewToken();
  const tokenHash = createHash("sha256").update(token).digest("hex");

  await oauthTokenRepository().delete({ clientId: client_id, userId: userId });
  const oauthToken = {
    tokenHash,
    clientId: client_id,
    userId: userId,
  };
  await oauthTokenRepository().save(oauthToken);

  const redirectUrl = new URL(redirect_uri);
  redirectUrl.hash = "token=" + token;
  return {
    redirect: { destination: redirectUrl.toString(), permanent: false },
  };
};
