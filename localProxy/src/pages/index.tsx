import { genNewToken } from "dev-in-prod-lib/src/utils";
import { GetServerSideProps } from "next";
import * as React from "react";

const go = () => {
  const destUrl = new URL("https://dsee.io/oauth2/authorize");
  destUrl.search = new URLSearchParams({
    response_type: "token",
    scope: "proxy",
    redirect_uri: "http://localhost:3004/oauth2/callback",
    // TODO use real client id
    client_id: "lp-" + genNewToken(),
  }).toString();
  location.href = destUrl.toString();
};

const Page = () => {
  return (
    <div>
      <button onClick={go}>go</button>
    </div>
  );
};

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  return { props: {} };
  //return { redirect: { permanent: false, destination: routerAuthUrl } };
};

export default Page;
