import { Connection, createConnection } from "typeorm";
import { OAuthTokenEntity } from "./entity/oauthToken";

export let db: Connection;

export const initDb = async () => {
  db = await createConnection({
    type: "postgres",
    host: "localhost",
    port: 5432,
    username: "",
    password: "",
    database: "devinprod",
    entities: [OAuthTokenEntity],
    synchronize: true,
    logging: true,
  });
};
