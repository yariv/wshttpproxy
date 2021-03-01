import { setupTest } from "dev-in-prod-lib/src/testLib";
import { ConnectionOptions } from "mysql2/typings/mysql";
import { routerMain } from "../../routerMain";
import { initDbProxy } from "../dbProxy";
import { connOptions, setupRouterTest } from "./utils";
import mysql, { Connection } from "mysql2/promise";
import { Schema } from "zod";
import { createOAuthToken } from "../utils";

describe("DbProxy", () => {
  const defer = setupTest();

  const getAuthError = async (query: string): Promise<string> => {
    const { dbProxyPort } = await setupRouterTest(defer);
    const conn = await mysql.createConnection({
      ...connOptions,
      port: dbProxyPort,
    });
    try {
      const res = await conn.query(query);
      fail();
    } catch (e) {
      return e.message;
    }
  };

  it("requires JSON auth", async () => {
    const msg = await getAuthError("select 1;");
    expect(msg).toStrictEqual(
      "First query should be a JSON encoded authentication packet."
    );
  });

  it("Checks schema", async () => {
    const packet = {
      type: "foo",
      params: { oauthToken: "asdf" },
    };

    const packetStr = JSON.stringify(packet);
    const msg = await getAuthError(packetStr);
    expect(msg.startsWith("1 validation issue(s)")).toBeTruthy();
  });

  it("requires valid oauthToken", async () => {
    const packet = {
      type: "authenticate",
      params: { oauthToken: "asdf" },
    };

    const packetStr = JSON.stringify(packet);
    const msg = await getAuthError(packetStr);
    expect(msg).toStrictEqual("Invalid oauthToken");
  });

  it("works", async () => {
    const { client, dbProxyPort } = await setupRouterTest(defer);
    const { oauthToken } = await client.call("createTestOAuthToken");
    const conn = await mysql.createConnection({
      ...connOptions,
      port: dbProxyPort,
    });
    const packet = {
      type: "authenticate",
      params: { oauthToken },
    };
    const res = await conn.query(JSON.stringify(packet));
    console.log(res);
  });
});
