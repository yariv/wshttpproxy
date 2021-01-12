import { signIn, signOut, useSession } from "next-auth/client";
import React from "react";

const HomePage = () => {
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
          <button onClick={(event) => signOut()}>Sign out</button>
        </>
      )}
    </>
  );
};

export default HomePage;
