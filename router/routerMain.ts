import { routerServerStart } from "./src/routerServer";
import { globalConfig } from "dev-in-prod-lib/src/utils";
import { AppServer } from "dev-in-prod-lib/src/appServer";
import { ConnectionOptions } from "mysql2/typings/mysql";
import mysql from "mysql2/promise";

export const routerMain = async (
  port: number,
  dbProxyPort: number,
  dbConnOptions: ConnectionOptions
): Promise<AppServer> => {
  return routerServerStart(port, __dirname, dbProxyPort, dbConnOptions);
};

if (require.main == module) {
  const connOptions: ConnectionOptions = {
    host: "localhost",
    port: 3306,
    user: "root",
    password: "root",
    database: "devinproddemo",
  };
  routerMain(
    globalConfig.routerPort,
    globalConfig.routerDbProxyPort,
    connOptions
  );
}
