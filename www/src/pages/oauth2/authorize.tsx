import { GetServerSideProps } from "next";
import { useSession, getSession, signIn, signOut } from "next-auth/client";

export default function Page() {
  const [session, loading] = useSession();

  if (typeof window !== "undefined" && loading) return null;

  if (!session)
    return (
      <div>
        <p>Access Denied</p>
        <button onClick={signIn}>Sign In</button>
      </div>
    );
  return (
    <>
      <h1>Protected Page</h1>
      <p>You can view this page because you are signed in.</p>
      <button onClick={signOut}>Sign out</button>
    </>
  );
}

// router.post("/authorize", async (ctx) => {
//   const { response_type, client_id, redirect_uri, scope } = ctx.query;
//   assert(response_type === "token");
//   assert(client_id === "devinprod_client");
//   var redirectUrl = new URL(redirect_uri);
//   assert(redirectUrl.host === "localhost");
//   assert(scope === "proxy");

//   ctx.body = "foo";
// });

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getSession(context);
  console.log("asdf");

  if (session) {
    console.log(session);
    session.user;
  }
  return {
    props: { session },
  };
};
