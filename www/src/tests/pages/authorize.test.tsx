import client, { Session } from "next-auth/client";
import { getServerSideProps } from "../../pages/oauth2/authorize";
import { db, initTestDb } from "../../db";
import { GetServerSidePropsResult } from "next";
import { Redirect } from "next/dist/lib/load-custom-routes";
import { oauthTokenRepository } from "../../entity/oauthToken";
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
    // TODO use a Session-derived type with a user id field.
    const mockSession = {
      expires: "1",
      user: { email: "a", name: "Delta", image: "c", id: 1 },
    };
    (client.getSession as jest.Mock).mockReturnValue(mockSession);

    expect(await oauthTokenRepository().findOne()).toBeUndefined();

    const res = (await getServerSideProps({
      query: validQuery,
    } as any)) as any;

    // check that the response is valid
    const redirect = (res as any).redirect as Redirect;
    expect(
      redirect.destination.startsWith(validQuery.redirect_uri)
    ).toBeTruthy();
    const destUrl = new URL(redirect.destination);
    console.log(destUrl.hash);
    expect(destUrl.hash.match("^#token=[a-zA-Z0-9]{40}")).toBeTruthy();
    const token = destUrl.hash.split("=")[1];

    // check that the token was persisted
    // TODO switch to token hash
    const tokenObj = await oauthTokenRepository().findOneOrFail({ token });
    expect(tokenObj.clientId).toStrictEqual(validQuery.client_id);
    expect(tokenObj).toStrictEqual({
      token,
      clientId: validQuery.client_id,
      userId: mockSession.user.id,
    });

    // check that a second request returns the same token
    const res2 = (await getServerSideProps({
      query: validQuery,
    } as any)) as any;
    expect(res2.redirect.destination).toStrictEqual(res.redirect.destination);
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
