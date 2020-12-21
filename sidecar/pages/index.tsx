import { GetServerSideProps } from "next";
import * as React from "react";

// TODO make configurable.
const routerAuthUrl = "http://localhost:3000/oauth2/authorize";
const redirectUrl = "http://localhost:3001/oauth2/callback";

const go = () => {
  const destUrl = new URL(routerAuthUrl);
  destUrl.search = new URLSearchParams({
    response_type: "token",
    scope: "proxy",
    redirect_uri: redirectUrl,
    client_id: "123",
  }).toString();
  location.href = destUrl.toString();
};

export default () => {
  return (
    <div>
      <button onClick={go}>go</button>
    </div>
  );
};

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  return { props: {} };
  return { redirect: { permanent: false, destination: routerAuthUrl } };
};
