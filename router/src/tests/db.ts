import { exec } from "child_process";
import { Client } from "pg";

export const initTestDb = async () => {
  const pgSettings = {
    database: "devinprod_test",
    host: "localhost",
    port: 5432,
  };

  await exec("createdb " + pgSettings.database);
  const client = new Client(pgSettings);
  await client.connect();
  await client.query(
    `DROP SCHEMA public CASCADE;
     CREATE SCHEMA public;`
  );
  await client.end();
};
