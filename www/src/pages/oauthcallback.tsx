import { GetServerSideProps, InferGetServerSidePropsType } from "next";
import { google } from "googleapis";
import { oauth2Client } from "../gapi";
import util from "util";

const log = (...x: any[]) => {
  console.log(
    util.inspect(x, { showHidden: false, depth: null, colors: true })
  );
};

export default function OathCallbackPage({
  data,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  console.log(data);
  return <div>Welcome {data}</div>;
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const code = context.query["code"] as string;
  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);
  const service = google.people({ version: "v1", auth: oauth2Client });
  const res = await service.people.get({
    personFields: "names,emailAddresses",
    resourceName: "people/me",
  });
  log(res);

  return { props: { data: code } };
};
