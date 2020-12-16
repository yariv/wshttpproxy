import { osconfig } from "googleapis/build/src/apis/osconfig";
import { Connection, createConnection } from "typeorm";
import { OAuthTokenEntity } from "./entity/oauthToken";
import { exec } from "child_process";
import { Client } from "pg";

export let db: Connection;

const entities = [OAuthTokenEntity];

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

  db = await createConnection({
    ...pgSettings,
    type: "postgres",
    username: "",
    password: "",
    entities: entities,
    synchronize: true,
    logging: false,
  });
};

export const initDb = async () => {
  db = await createConnection({
    type: "postgres",
    host: "localhost",
    port: 5432,
    username: "",
    password: "",
    database: "devinprod",
    entities: entities,
    synchronize: true,
    logging: true,
  });
};
