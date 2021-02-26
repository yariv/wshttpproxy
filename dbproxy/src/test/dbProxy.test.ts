import mysql, { Connection, RowDataPacket } from "mysql2/promise";
import { MySqlProxy } from "../mysqlProxy";
import portfinder from "portfinder";
import { genNewToken } from "dev-in-prod-lib/src/utils";
import { setupTest } from "dev-in-prod-lib/src/testLib";

describe("dbProxy", () => {
  const defer = setupTest();

  const setup = async (): Promise<{
    directConn: Connection;
    proxiedConn: Connection;
    dbProxy: MySqlProxy;
    tableName: string;
  }> => {
    const proxyPort = await portfinder.getPortPromise();
    const dbPort = 3306;
    const connOptions = {
      host: "127.0.0.1",
      user: "root",
      password: "root",
      database: "test",
    };

    const dbProxy = new MySqlProxy({ ...connOptions, port: dbPort });
    await dbProxy.listen(proxyPort);
    defer(dbProxy.close.bind(dbProxy));

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
      port: proxyPort,
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
});
