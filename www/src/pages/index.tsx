import { GetServerSideProps, InferGetServerSidePropsType } from "next";
import { oauth2Client } from "../gapi";
const log = console.log;

function HomePage({
  data,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  console.log(data);
  return <div>Welcome {data}</div>;
}

export const getServerSideProps: GetServerSideProps = async (context) => {
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

export default HomePage;
