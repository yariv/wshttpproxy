import { globalConfig } from "dev-in-prod-lib/src/utils";
import dotenv from "dotenv";
import { ConnectionOptions } from "mysql2";
import next from "next";
import { LocalProxy } from "./src/localProxy";
dotenv.config();

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
  await localProxy.listen(port, __dirname, next);
  await localProxy.connectWs();
  return localProxy;
};

if (require.main == module) {
  if (!process.env.AUTH_TOKEN) {
    throw new Error("Missing AUTH_TOKEN environment variable.");
  }

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
    process.env.AUTH_TOKEN
  );
}
