import { GetServerSideProps, InferGetServerSidePropsType } from "next";
import { google } from "googleapis";
import { oauth2Client } from "../gapi";
import { User, UserEntity } from "../entity/oauthToken";
import { db } from "../db";
import { log } from "../log";
import { getRepository } from "typeorm";

export default function OathCallbackPage({
  data,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  log(data);
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
