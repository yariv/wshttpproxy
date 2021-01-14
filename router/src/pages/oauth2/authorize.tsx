import { createHash } from "crypto";
import { GetServerSideProps } from "next";
import { getSession, signIn, signOut, useSession } from "next-auth/client";
import * as React from "react";
import * as z from "zod";
import { genNewToken } from "../../utils";
import { prisma } from "../../prisma";

const AuthorizePage = () => {
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
};

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

  const userId = (session.user as any).id;

  const token = genNewToken();
  const tokenHash = createHash("sha256").update(token).digest("hex");

  // we use deleteMany to avoid
  await prisma.oAuthToken.deleteMany({
    where: { userId, clientId: client_id },
  });

  await prisma.oAuthToken.create({
    data: { clientId: client_id, tokenHash, user: { connect: { id: userId } } },
  });

  const redirectUrl = new URL(redirect_uri);
  redirectUrl.hash = "token=" + token;

  return {
    redirect: { destination: redirectUrl.toString(), permanent: false },
  };
};

export default AuthorizePage;
