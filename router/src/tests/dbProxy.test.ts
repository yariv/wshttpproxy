import { setupTest } from "../../../lib/src/testLib";
import mysql, { Connection } from "mysql2/promise";
import { genNewToken } from "../utils";
import { connOptions, setupRouterTest } from "./utils";

describe("Router DbProxy", () => {
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
      params: { authToken: "asdf" },
    };

    const packetStr = JSON.stringify(packet);
    const msg = await getAuthError(packetStr);
    expect(msg.startsWith("1 validation issue(s)")).toBeTruthy();
  });

  it("requires valid authToken", async () => {
    const packet = {
      type: "authenticate",
      params: { authToken: "asdf" },
    };

    const packetStr = JSON.stringify(packet);
    const msg = await getAuthError(packetStr);
    expect(msg).toStrictEqual("Invalid authToken");
  });

  const authenticate = async (): Promise<Connection> => {
    const { client, dbProxyPort } = await setupRouterTest(defer);
    const { authToken } = await client.call("createAuthToken");
    const conn = await mysql.createConnection({
      ...connOptions,
      port: dbProxyPort,
    });
    const packet = {
      type: "authenticate",
      params: { authToken },
    };
    await conn.query(JSON.stringify(packet));
    return conn;
  };

  it("simple query works", async () => {
    const conn = await authenticate();
    const [[res]] = (await conn.query("select 1 as a")) as any;
    expect(res.a).toStrictEqual(1);
  });

  const setupWriteTest = async (): Promise<{
    directConn: Connection;
    proxiedConn: Connection;
    tableName: string;
  }> => {
    // connect to the actual db
    const directConn = await mysql.createConnection({
      ...connOptions,
      port: 3306,
    });
    defer(directConn.end.bind(directConn));
    // note: randomized table names help multiple tests run in parallel
    // without naming collisions
    const tableName = "test_" + genNewToken();
    directConn.query(`
    create table ${tableName} (
        id integer auto_increment primary key,
        val text
        )`);

    const conn = await authenticate();
    defer(async () => {
      await directConn.query("drop table " + tableName);
    });
    return { directConn, proxiedConn: conn, tableName };
  };

  it("crud works", async () => {
    const { proxiedConn, tableName } = await setupWriteTest();
    await proxiedConn.query(`insert into ${tableName}(val) values('test');`);
    const [res] = (await proxiedConn.query(
      `select * from ${tableName}`
    )) as any;
    expect(res.length).toStrictEqual(1);
    expect(res[0].id).toStrictEqual(1);
    expect(res[0].val).toStrictEqual("test");

    await proxiedConn.query(`update ${tableName} set val=? where id=?`, [
      "foo",
      res[0].id,
    ]);
    const [res1] = (await proxiedConn.query(
      `select * from ${tableName}`
    )) as any;
    expect(res.length).toStrictEqual(1);
    expect(res1[0].id).toStrictEqual(1);
    expect(res1[0].val).toStrictEqual("foo");

    await proxiedConn.query(`delete from ${tableName}`);
    const [res2] = (await proxiedConn.query(
      `select * from ${tableName}`
    )) as any;
    expect(res2.length).toStrictEqual(0);
  });

  it("isolation works", async () => {
    const { directConn, proxiedConn, tableName } = await setupWriteTest();
    await proxiedConn.query(`insert into ${tableName}(val) values('test');`);
    const [res] = (await directConn.query(`select * from ${tableName}`)) as any;
    expect(res.length).toStrictEqual(0);

    // isolation works even after the connection ends
    proxiedConn.destroy();

    const [res1] = (await directConn.query(
      `select * from ${tableName}`
    )) as any;
    expect(res1.length).toStrictEqual(0);
  });

  const doTxTest = async (
    startTxQuery: string,
    endTxQuery: string,
    expectedVal: string
  ) => {
    const { directConn, proxiedConn, tableName } = await setupWriteTest();
    await proxiedConn.query(`insert into ${tableName}(val) values('test');`);
    const [res0] = (await proxiedConn.query(
      `select * from ${tableName}`
    )) as any;
    console.log(res0);
    expect(res0.length).toStrictEqual(1);
    expect(res0[0].val).toStrictEqual("test");

    await proxiedConn.query(startTxQuery);
    await proxiedConn.query(`update ${tableName} set val="foo" `);
    const [res1] = (await proxiedConn.query(
      `select * from ${tableName}`
    )) as any;
    expect(res1.length).toStrictEqual(1);
    expect(res1[0].val).toStrictEqual("foo");

    await proxiedConn.query(endTxQuery);
    const [res2] = (await proxiedConn.query(
      `select * from ${tableName}`
    )) as any;
    expect(res2.length).toStrictEqual(1);
    expect(res2[0].val).toStrictEqual(expectedVal);

    const [res3] = (await directConn.query(
      `select * from ${tableName}`
    )) as any;
    expect(res3.length).toStrictEqual(0);
  };

  it("rollback works", async () => {
    await doTxTest("begin", "rollback", "test");
  });

  it("commit works", async () => {
    await doTxTest("begin", "commit", "foo");
  });

  it("start transaction rollback works", async () => {
    await doTxTest("start transaction", "rollback", "test");
  });

  it("start transaction commit works", async () => {
    await doTxTest("start transaction", "commit", "foo");
  });

  it("auto commits savepoint on second begin", async () => {
    const { directConn, proxiedConn, tableName } = await setupWriteTest();
    await proxiedConn.query("begin");
    await proxiedConn.query(`insert into ${tableName}(val) values('test');`);
    await proxiedConn.query("begin");
    await proxiedConn.query(`update ${tableName} set val="foo" `);
    const [res0] = (await proxiedConn.query(
      `select * from ${tableName}`
    )) as any;
    expect(res0.length).toStrictEqual(1);
    expect(res0[0].val).toStrictEqual("foo");
    await proxiedConn.query("rollback");
    const [res1] = (await proxiedConn.query(
      `select * from ${tableName}`
    )) as any;
    console.log(res1);
    expect(res1.length).toStrictEqual(1);
    expect(res1[0].val).toStrictEqual("test");
  });

  it("disallows non crud queries", async () => {
    const { proxiedConn, tableName } = await setupWriteTest();

    // see https://dev.mysql.com/doc/refman/8.0/en/implicit-commit.html for some bad queries
    const invalidQueries = [
      "set autocommit=1",
      "set autocommit = 1",
      "drop table " + tableName,
      "create table foo",
      "lock tables",
      "unlock tables",
    ];
    for (const query of invalidQueries) {
      try {
        const res = await proxiedConn.query(query);
      } catch (e) {
        expect(e.message).toStrictEqual("Invalid query: " + query);
      }
    }
  });
});
