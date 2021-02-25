import mysql, { Connection } from "mysql2/promise";
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
    await proxiedConn.query(`insert into ${tableName}(val) values('foo')`);
    const [res1] = await proxiedConn.query("select * from " + tableName);
    const [res2] = await proxiedConn.query("select * from " + tableName);
    console.log("foo", res1, res2);
    expect(res1).toEqual(res2);

    // try {
    //   await proxiedConn.query("rollbac");
    // } catch (err) {
    //   console.log("fff", err);
    // }

    // const [results, fields] = await proxiedConn.query(
    //   `select * from ${tableName}`
    // );
    // console.log("The solution is: ", results);
  });
});
