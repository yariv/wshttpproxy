import { Redirect } from "next/dist/lib/load-custom-routes";
import { getServerSideProps } from "../../../pages/oauth2/authorize";
import { sha256 } from "../../../utils";
import { initTestDb } from "../../db";
import { prisma } from "../../../prisma";
import { setupMockSession } from "../../testLib";
import client from "next-auth/client";
jest.mock("next-auth/client");

describe("authorize", () => {
  // console.log(3);
  beforeEach(async () => {
    await initTestDb();
  });

  afterEach(async () => {
    await prisma.$disconnect();
  });

  const validQuery = {
    redirect_uri: "http://foo",
    scope: "proxy",
    response_type: "token",
    client_id: "foo",
  };

  it("works", async () => {
    await setupMockSession();

    expect(await prisma.oAuthToken.count()).toStrictEqual(0);
    const res = (await getServerSideProps({
      query: validQuery,
    } as any)) as any;

    // check that the response is valid
    const redirect = (res as any).redirect as Redirect;
    expect(
      redirect.destination.startsWith(validQuery.redirect_uri)
    ).toBeTruthy();
    const destUrl = new URL(redirect.destination);
    expect(destUrl.hash.match("^#token=[a-zA-Z0-9]{40}")).toBeTruthy();
    const token = destUrl.hash.split("=")[1];

    // check that the token was persisted
    const tokenHash = sha256(token);
    const tokenObj = await prisma.oAuthToken.findUnique({
      where: { tokenHash },
    });
    expect(tokenObj).toBeDefined();
    expect(tokenObj?.clientId).toStrictEqual(validQuery.client_id);

    const session = await client.getSession();
    expect(tokenObj?.userId).toStrictEqual((session?.user as any).id);
    expect(tokenObj?.tokenHash).toStrictEqual(tokenHash);

    // check that a second request updates the token hash
    const res2 = (await getServerSideProps({
      query: validQuery,
    } as any)) as any;
    expect(res2.redirect.destination).not.toStrictEqual(
      res.redirect.destination
    );
    const tokenObj2 = await prisma.oAuthToken.findUnique({
      where: { tokenHash },
    });
    expect(tokenObj2).toBeNull();

    // Check that the url contains the raw token
    const destUrl2 = new URL(res2.redirect.destination);
    const token2 = destUrl2.hash.split("=")[1];
    const token2Hash = sha256(token2);

    const tokenObj3 = await prisma.oAuthToken.findUnique({
      where: { tokenHash: token2Hash },
    });
    expect(tokenObj3).toBeDefined();
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
