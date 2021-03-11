import dotenv from "dotenv";
import { ConnectionOptions } from "mysql2";
import { globalConfig } from "../lib/src/utils";
import { LocalProxy } from "./src/localProxy";
const envFileName = __dirname + "/.env";
dotenv.config({ path: envFileName });

export const localProxyMain = async (
  port: number,
  routerWsUrl: string,
  routerDbConnOptions: ConnectionOptions,
  localServiceUrl: string,
  localDbPort: number,
  authToken: string
): Promise<LocalProxy> => {
  const localProxy = new LocalProxy(
    routerWsUrl,
    routerDbConnOptions,
    localServiceUrl,
    localDbPort,
    authToken
  );
  await localProxy.listen();
  await localProxy.connectWs();
  return localProxy;
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
  const routerDbConnOptions: ConnectionOptions = {
    host: "devinproddemo.com",
    port: globalConfig.routerDbProxyPort,
    user: "root",
    password: "root",
    database: "devinproddemo",
  };
  const localDbPort = globalConfig.routerDbProxyPort;

  localProxyMain(
    globalConfig.localProxyPort,
    routerWsUrl,
    routerDbConnOptions,
    localServiceUrl,
    localDbPort,
    authToken
  );
}
