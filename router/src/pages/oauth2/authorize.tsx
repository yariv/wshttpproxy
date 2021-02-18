import { GetServerSideProps } from "next";
import { getSession, signIn, signOut, useSession } from "next-auth/client";
import * as React from "react";
import * as z from "zod";
import { createOAuthToken } from "../../utils";
import util from "util";
import { prisma } from "../../prisma";

const AuthorizePage = ({ oauthToken }: { oauthToken: string }) => {
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
      <div>Token: {oauthToken}</div>
      <button onClick={() => signOut()}>Sign out</button>
    </>
  );
};

const args = z.object({
  response_type: z.literal("token"),
  scope: z.literal("proxy"),
  redirect_uri: z.string().url(),
  client_id: z.string(),
});

export const log = (...x: any[]) => {
  console.log(
    util.inspect(x, { showHidden: false, depth: null, colors: true })
  );
};

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const { client_id, redirect_uri } = args.parse(ctx.query);

  const session = await getSession(ctx);
  if (!session) {
    return { props: {} };
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email! },
  });
  if (!user) {
    throw new Error("Missing user");
  }

  const oauthToken = await createOAuthToken(user.id, client_id);

  const redirectUrl = new URL(redirect_uri);
  redirectUrl.hash = "token=" + oauthToken;

  return {
    redirect: { destination: redirectUrl.toString(), permanent: false },
  };
};

export default AuthorizePage;
