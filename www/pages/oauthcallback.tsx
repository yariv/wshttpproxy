import { GetServerSideProps } from "next";
import { google } from "googleapis";

export const getServerSideProps: GetServerSideProps = async (context) => {
  const code = context.query["code"];
  const { tokens } = await oauth2Client.getToken(code);

  return { props: {} };
};
