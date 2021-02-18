import { GetServerSideProps } from "next";
import { getSession, signIn, signOut, useSession } from "next-auth/client";
import React from "react";
import { prisma } from "../prisma";
import { createOAuthToken } from "../utils";

const HomePage = ({ oauthToken }: { oauthToken: string }) => {
  const [session, loading] = useSession();

  return (
    <>
      {!session && (
        <>
          Not signed in <br />
          <button onClick={(event) => signIn()}>Sign in</button>
        </>
      )}
      {session && (
        <>
          Signed in as {session.user.email} <br />
          <div>Token: {oauthToken}</div>
          <button onClick={(event) => signOut()}>Sign out</button>
        </>
      )}
    </>
  );
};

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const session = await getSession(ctx);
  if (!session) {
    return { props: {} };
  }

  // TODO refactor
  const user = await prisma.user.findUnique({
    where: { email: session.user.email! },
  });
  if (!user) {
    throw new Error("Missing user");
  }

  const clientId = "web";
  const oauthToken = await createOAuthToken(user.id, clientId);
  return { props: { oauthToken } };
};

export default HomePage;
