import mysql from "mysql2/promise";
import { MySqlProxy } from "../mysqlProxy";
import portfinder from "portfinder";
import { genNewToken } from "dev-in-prod-lib/src/utils";
import { setupTest } from "dev-in-prod-lib/src/testLib";

describe("dbProxy", () => {
  const defer = setupTest();

  it("works", async () => {
    const proxyPort = await portfinder.getPortPromise();
    const dbPort = 3306;

    const connOptions = {
      host: "127.0.0.1",
      user: "root",
      password: "root",
      database: "test",
    };

    // connect to the actual db
    var directConn = await mysql.createConnection({
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
        val string
        )`);
    defer(async () => {
      await directConn.query("drop table " + tableName);
    });
    directConn.query(`delete from ${tableName}`);
    await directConn.query(`insert into ${tableName}(val) values('foo')`);

    const dbProxy = new MySqlProxy({ ...connOptions, port: dbPort });
    await dbProxy.listen(proxyPort);
    defer(dbProxy.close.bind(dbProxy));

    const proxiedConn = await mysql.createConnection({
      ...connOptions,
      port: proxyPort,
    });
    defer(proxiedConn.end.bind(proxiedConn));
    //await connection.beginTransaction();

    try {
      await proxiedConn.query("rollbac");
    } catch (err) {
      console.log("fff", err);
    }

    const [results, fields] = await proxiedConn.query(
      `select * from ${tableName}`
    );
    console.log("The solution is: ", results);
  });
});
