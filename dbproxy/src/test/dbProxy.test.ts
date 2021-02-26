import { setupTest } from "dev-in-prod-lib/src/testLib";
import { genNewToken } from "dev-in-prod-lib/src/utils";
import mysql, { Connection } from "mysql2/promise";
import portfinder from "portfinder";
import { MySqlProxy } from "../mysqlProxy";

describe("dbProxy", () => {
  const defer = setupTest();

  const connOptions = {
    host: "127.0.0.1",
    user: "root",
    password: "root",
    database: "test",
  };
  const dbPort = 3306;

  const setupProxy = async (): Promise<MySqlProxy> => {
    const proxyPort = await portfinder.getPortPromise();

    const dbProxy = new MySqlProxy(proxyPort, { ...connOptions, port: dbPort });
    await dbProxy.listen();
    defer(dbProxy.close.bind(dbProxy));
    return dbProxy;
  };

  const setup = async (): Promise<{
    directConn: Connection;
    proxiedConn: Connection;
    dbProxy: MySqlProxy;
    tableName: string;
  }> => {
    const dbProxy = await setupProxy();

    // connect to the actual db
    const directConn = await mysql.createConnection({
      ...connOptions,
      port: dbPort,
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
    defer(async () => {
      await directConn.query("drop table " + tableName);
    });
    directConn.query(`delete from ${tableName}`);

    const proxiedConn = await mysql.createConnection({
      ...connOptions,
      port: dbProxy.port,
    });
    defer(proxiedConn.end.bind(proxiedConn));
    return { directConn, proxiedConn, dbProxy, tableName };
  };

  it("works", async () => {
    //await connection.beginTransaction();
    const { directConn, proxiedConn, tableName } = await setup();
    const getResults = async () => {
      const query = "select * from " + tableName;
      const [res1, fields1] = (await directConn.query(query)) as any;
      const [res2, fields2] = (await proxiedConn.query(query)) as any;
      // TODO test fields
      return [res1, res2];
    };
    const [res1_1, res2_1] = await getResults();
    expect(res1_1.length).toBe(0);
    expect(res2_1.length).toBe(0);

    await proxiedConn.query(`insert into ${tableName}(val) values('foo')`);
    const [res1_2, res2_2] = await getResults();

    expect(res1_2.length).toEqual(1);
    expect({ id: res1_2[0].id, val: res1_2[0].val }).toEqual({
      id: 1,
      val: "foo",
    });
    expect(res1_2).toEqual(res2_2);
  });

  it("allows valid queries", async () => {
    const { proxiedConn, tableName } = await setup();
    const validQueries = [
      "select * from " + tableName,
      `insert into ${tableName}(val) values('foo')`,
      `update ${tableName} set val='bar'`,
      "delete from " + tableName,
      "begin",
      "commit",
      "start transaction",
      "rollback",
    ];
    for (const query of validQueries) {
      // this will throw if not valid
      await proxiedConn.query(query);
    }
  });

  it("disallows invalid queries", async () => {
    const { proxiedConn, tableName } = await setup();
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
        console.log("FOO", query, res);
      } catch (e) {
        expect(e.message).toStrictEqual("Invalid query: " + query);
      }
    }
  });

  it("client disconnects when proxy conn disconnects", async () => {
    // connect to the actual db
    const { directConn, proxiedConn } = await setup();
    const [res] = (await directConn.query("show processlist")) as any;

    return new Promise((resolve) => {
      proxiedConn.on("error", () => {
        resolve(null);
      });
      // note: the proxy conn is the last one
      directConn.query("kill " + res[res.length - 1].Id);
    });
  });

  it("proxy conn disconnects after client disconnects", async () => {
    const { directConn, proxiedConn } = await setup();
    const [res1] = (await directConn.query("show processlist")) as any;
    await proxiedConn.end();
    // TODO find a less fragile way of testing this?
    await new Promise((resolve) => setTimeout(resolve, 10));
    const [res2] = (await directConn.query("show processlist")) as any;
    expect(res2.length).toBe(res1.length - 1);
  });

  it("multiple statements are disallowed", async () => {
    const dbProxy = await setupProxy();
    const directConn = await mysql.createConnection({
      ...connOptions,
      multipleStatements: true,
      port: dbPort,
    });
    defer(directConn.end.bind(directConn));

    const [res] = (await directConn.query("select 1; select 1;")) as any;
    expect(res.length).toStrictEqual(2);

    console.log(res);
    const proxiedConn = await mysql.createConnection({
      ...connOptions,
      multipleStatements: true,
      port: dbProxy.port,
    });
    defer(directConn.end.bind(directConn));
    try {
      await proxiedConn.query("select 1; select 1;");
      fail();
    } catch (e) {
      expect(
        e.message.startsWith("You have an error in your SQL syntax")
      ).toBeTruthy();
    }
  });
});
