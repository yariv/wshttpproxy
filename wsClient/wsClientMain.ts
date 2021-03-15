import dotenv from "dotenv";
import { ConnectionOptions } from "mysql2";
import { globalConfig } from "../lib/src/utils";
import { WsClient } from "./src/wsClient";
const envFileName = __dirname + "/.env";
dotenv.config({ path: envFileName });

export const wsClientMain = async (
  routerWsUrl: string,
  localServiceUrl: string,
  authToken: string
): Promise<WsClient> => {
  const wsClient = new WsClient(routerWsUrl, localServiceUrl, authToken);
  await wsClient.connectWs();
  return wsClient;
};

if (require.main == module) {
  if (!process.env.AUTH_TOKEN) {
    console.error(
      `Missing AUTH_TOKEN environment variable. Please add it in ${envFileName}.`
    );
    process.exit();
  }

  const authToken = process.env.AUTH_TOKEN;
  const routerWsUrl = "wss://dsee.io/ws";
  const localServiceUrl = globalConfig.exampleProdUrl;

  wsClientMain(routerWsUrl, localServiceUrl, authToken);
}
