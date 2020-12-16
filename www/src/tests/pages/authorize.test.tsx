import client, { Session } from "next-auth/client";
import { getServerSideProps } from "../../pages/oauth2/authorize";
import { db, initTestDb } from "../../db";
import { GetServerSidePropsResult } from "next";
import { Redirect } from "next/dist/lib/load-custom-routes";
global.fetch = require("node-fetch");
jest.mock("next-auth/client");

describe("authorize", () => {
  beforeAll(async () => {
    await initTestDb();
  });

  afterAll(async () => {
    await db.close();
  });

  const validQuery = {
    redirect_uri: "http://foo",
    scope: "proxy",
    response_type: "token",
    client_id: "foo",
  };

  it("works", async () => {
    const mockSession: Session = {
      expires: "1",
      user: { email: "a", name: "Delta", image: "c" },
    };
    (client.getSession as jest.Mock).mockReturnValueOnce(mockSession);

    const res = (await getServerSideProps({
      query: validQuery,
    } as any)) as any;
    const redirect = (res as any).redirect as Redirect;
    expect(
      redirect.destination.startsWith(validQuery.redirect_uri)
    ).toBeTruthy();
    const destUrl = new URL(redirect.destination);
    console.log(destUrl.hash);
    expect(destUrl.hash.match("^#token=[a-zA-Z0-9]{40}")).toBeTruthy();
  });

  it("requires login", async () => {
    (client.getSession as jest.Mock).mockReturnValueOnce(null);
    const res = (await getServerSideProps({
      query: validQuery,
    } as any)) as any;
    expect(res).toStrictEqual({ props: {} });
  });

  it("validates required params", async () => {
    for (const key of Object.keys(validQuery)) {
      const query = { ...validQuery } as any;
      delete query[key];
      await expect(getServerSideProps({ query } as any)).rejects.toThrow();
    }
  });

  it("validates param values", async () => {
    for (const key of ["redirect_uri", "scope", "response_type"]) {
      const query = { ...validQuery } as any;
      query[key] = "foo";
      await expect(getServerSideProps({ query } as any)).rejects.toThrow();
    }
  });
});
