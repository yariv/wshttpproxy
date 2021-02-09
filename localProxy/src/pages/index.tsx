import { globalConfig } from "dev-in-prod-lib/dist/utils";
import { GetServerSideProps } from "next";
import * as React from "react";

// TODO make configurable.
const routerAuthUrl = `${globalConfig.routerUrl}/oauth2/authorize`;
const redirectUrl = `${globalConfig.localProxyUrl}/oauth2/callback`;

const go = () => {
  const destUrl = new URL(routerAuthUrl);
  destUrl.search = new URLSearchParams({
    response_type: "token",
    scope: "proxy",
    redirect_uri: redirectUrl,
    // TODO use real client id
    client_id: "123",
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
  return { redirect: { permanent: false, destination: routerAuthUrl } };
};

export default Page;
