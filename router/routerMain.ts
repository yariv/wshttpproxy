import { AppServer } from "dev-in-prod-lib/src/appServer";
import { globalConfig } from "dev-in-prod-lib/src/utils";
import { ConnectionOptions } from "mysql2/typings/mysql";
import { routerServerStart } from "./src/routerServer";

export const routerMain = async (
  port: number,
  dbProxyPort: number,
  dbConnOptions: ConnectionOptions
): Promise<AppServer> => {
  return routerServerStart(port, dbProxyPort, dbConnOptions);
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
