import { routerServerStart } from "./src/routerServer";
import { globalConfig } from "dev-in-prod-lib/src/utils";
import { AppServer } from "dev-in-prod-lib/src/appServer";
import { ConnectionOptions } from "mysql2/typings/mysql";

export const routerMain = (
  port: number,
  dbProxyPort: number,
  dbConnOptions: ConnectionOptions
): Promise<AppServer> => {
  return routerServerStart(port, __dirname, dbProxyPort, dbConnOptions);
};

if (require.main == module) {
  const connOptions: ConnectionOptions = {
    host: "127.0.0.1",
    port: 3306,
    user: "root",
    password: "root",
    database: "test",
  };
  routerMain(
    globalConfig.routerPort,
    globalConfig.routerDbProxyPort,
    connOptions
  );
}
