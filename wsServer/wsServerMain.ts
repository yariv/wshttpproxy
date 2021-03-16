import dotenv from "dotenv";
import { writeFileSync } from "fs";
import { AppServer } from "../lib/src/appServer";
import { genNewToken, config } from "../lib/src/utils";
import { sha256 } from "./src/utils";
import { wsServerStart } from "./src/wsServer";
import { parse } from "ts-command-line-args";

const envFileName = __dirname + "/.env";
dotenv.config({ path: envFileName });

interface ReverseProxyArguments {
  port: number;
}

export const routerMain = async (
  port: number,
  routingSecret: string
): Promise<AppServer> => {
  return wsServerStart(port, routingSecret);
};

if (require.main == module) {
  const args = parse<ReverseProxyArguments>({
    port: Number,
  });
  let routingSecret = process.env.ROUTING_SECRET;
  if (!routingSecret) {
    routingSecret = genNewToken();
    console.log(`
Your new routing secret is ${routingSecret}.
Its hash saved in ${envFileName}.
Proxy requests to the router must include the routing secret in the HTTP header "${config.routingSecretHeader}".`);
    writeFileSync(envFileName, "ROUTING_SECRET_HASH=" + sha256(routingSecret));
  }

  routerMain(args.port, routingSecret);
}
