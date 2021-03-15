import dotenv from "dotenv";
import { writeFileSync } from "fs";
import { AppServer } from "../lib/src/appServer";
import { genNewToken, globalConfig } from "../lib/src/utils";
import { wsServerStart } from "./src/wsServer";

const envFileName = __dirname + "/.env";
dotenv.config({ path: envFileName });

export const routerMain = async (
  port: number,
  routingSecret: string
): Promise<AppServer> => {
  return wsServerStart(port, routingSecret);
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

  routerMain(globalConfig.routerPort, routingSecret);
}
