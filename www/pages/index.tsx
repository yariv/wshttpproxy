import { GetServerSideProps, InferGetServerSidePropsType } from "next";
import { google } from "googleapis";

const config = {
  googleConfigFilePath: ".google_config.json",
};

function HomePage({
  data,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  console.log(data);
  return <div>Welcome {data}</div>;
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  // check the auth domain
  const googleConfig = require(config.googleConfigFilePath).web;
  const oauth2Client = new google.auth.OAuth2(
    googleConfig.client_id,
    googleConfig.client_secret,
    googleConfig.redirect_uris[0]
  );

  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
  });

  return { props: { data: "hi" } };
};

export default HomePage;
