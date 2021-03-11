import dotenv from "dotenv";
import { writeFileSync } from "fs";
import { ConnectionOptions } from "mysql2/typings/mysql";
import { AppServer } from "../lib/src/appServer";
import { genNewToken, globalConfig } from "../lib/src/utils";
import { routerServerStart } from "./src/routerServer";

const envFileName = __dirname + "/.env";
dotenv.config({ path: envFileName });

export const routerMain = async (
  port: number,
  routingSecret: string,
  dbProxyPort: number,
  dbConnOptions: ConnectionOptions
): Promise<AppServer> => {
  return routerServerStart(port, routingSecret, dbProxyPort, dbConnOptions);
};

if (require.main == module) {
  let routingSecret = process.env.ROUTING_SECRET;
  if (!routingSecret) {
    routingSecret = genNewToken();
    console.log(`
Your new routing secret is ${routingSecret}.
It's saved in ${envFileName}.
Proxy requests to the router must include the routing secret in the HTTP header "${globalConfig.routingSecretHeader}".`);
    writeFileSync(envFileName, "ROUTING_SECRET=" + routingSecret);
  }

  routerMain(
    globalConfig.routerPort,
    routingSecret,
    globalConfig.routerDbProxyPort,
    globalConfig.defaultDbConnOptions
  );
}
