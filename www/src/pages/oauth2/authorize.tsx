import { GetServerSideProps } from "next";
import { useSession, getSession, signIn, signOut } from "next-auth/client";
import {
  OAuthTokenEntity,
  oauthTokenRepository,
} from "../../entity/oauthToken";
import { strict as assert } from "assert";
import { UserWithId } from "../api/auth/[...nextauth]";

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

// router.post("/authorize", async (ctx) => {
//   const { response_type, client_id, redirect_uri, scope } = ctx.query;
//   assert(response_type === "token");
//   assert(client_id === "devinprod_client");
//   var redirectUrl = new URL(redirect_uri);
//   assert(redirectUrl.host === "localhost");
//   assert(scope === "proxy");

//   ctx.body = "foo";
// });

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const { response_type, client_id, redirect_uri, scope } = ctx.query as Record<
    string,
    string
  >;
  assert(response_type === "token");
  //   assert((client_id as string).startsWith("devinprod"));
  var redirectUrl = new URL(redirect_uri as string);
  //   assert(redirectUrl.host === "localhost");
  assert(scope === "proxy");

  const session = await getSession(ctx);

  if (!session) {
    return { props: {} };
  }

  const userId = (session.user as UserWithId).id;
  const oauthToken = oauthTokenRepository().findOne({
    where: { clientId: client_id, userId: userId },
  });

  if (!oauthToken) {
    const newToken = genNewToken();
    oauthTokenRepository().create({
      token: newToken,
      clientId: client_id,
      userId: userId,
    });
  }
  console.log(session);
  session.user;
  return {
    props: { session },
  };
};
