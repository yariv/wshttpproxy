import { GetServerSideProps, InferGetServerSidePropsType } from "next";
import { userRepository } from "../entity/oauthToken";
import { oauth2Client } from "../gapi";
import React from "react";
import { signIn, signOut, useSession } from "next-auth/client";

export default function Page() {
  const [session, loading] = useSession();

  return (
    <>
      {!session && (
        <>
          Not signed in <br />
          <button onClick={signIn}>Sign in</button>
        </>
      )}
      {session && (
        <>
          Signed in as {session.user.email} <br />
          <button onClick={signOut}>Sign out</button>
        </>
      )}
    </>
  );
}

function HomePage({
  data,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  console.log(data);
  return <div>Welcome {data}</div>;
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  //log(await userRepository().findOne(1));
  return { props: {} };

  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: [
      "https://www.googleapis.com/auth/userinfo.email",
      "https://www.googleapis.com/auth/userinfo.profile",
    ],
  });

  return { redirect: { destination: url, permanent: false }, props: {} };
  log(url);

  return { props: { data: "hi" } };
};
