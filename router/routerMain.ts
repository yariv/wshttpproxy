import { AppServer } from "../lib/src/appServer";
import { globalConfig } from "../lib/src/utils";
import { ConnectionOptions } from "mysql2/typings/mysql";
import { routerServerStart } from "./src/routerServer";
import dotenv from "dotenv";
dotenv.config();

export const routerMain = async (
  port: number,
  applicationSecret: string,
  dbProxyPort: number,
  dbConnOptions: ConnectionOptions
): Promise<AppServer> => {
  return routerServerStart(port, applicationSecret, dbProxyPort, dbConnOptions);
};

if (require.main == module) {
  const applicationSecret = process.env.APPLICATION_SECRET;
  if (!applicationSecret) {
    // TODO automatically create config file
    throw new Error("Missing APPLICATION_SECRET environment variable");
  }

  routerMain(
    globalConfig.routerPort,
    applicationSecret,
    globalConfig.routerDbProxyPort,
    globalConfig.defaultDbConnOptions
  );
}
