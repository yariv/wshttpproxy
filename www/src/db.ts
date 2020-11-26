import { Connection, createConnection } from "typeorm";
//import { UserEntity } from "./entity/user";

export let db: Connection;

export const initDb = async () => {
  db = await createConnection({
    type: "postgres",
    host: "localhost",
    port: 5432,
    username: "",
    password: "",
    database: "devinprod",
    entities: [UserEntity],
    synchronize: true,
    logging: false,
  });
};
