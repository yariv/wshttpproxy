import { globalConfig } from "dev-in-prod-lib/src/utils";
import dotenv from "dotenv";
import { ConnectionOptions } from "mysql2";
import next from "next";
import { rootCertificates } from "tls";
import { LocalProxy } from "./src/localProxy";
dotenv.config();

export const localProxyMain = async (
  port: number,
  applicationSecret: string,
  routerApiUrl: string,
  routerWsUrl: string,
  routerDbConnOptions: ConnectionOptions,
  localServiceUrl: string,
  localDbPort: number
): Promise<LocalProxy> => {
  const localProxy = new LocalProxy(
    applicationSecret,
    routerApiUrl,
    routerWsUrl,
    routerDbConnOptions,
    localServiceUrl,
    localDbPort
  );
  await localProxy.listen(port, __dirname, next);
  return localProxy;
};

if (require.main == module) {
  if (!process.env.APPLICATION_SECRET) {
    throw new Error("Missing APPLICATION_SECRET environment variable.");
  }

  const routerWsUrl = "wss://dsee.io/ws";
  const routerApiUrl = "https://dsee.io/api";
  const localServiceUrl = globalConfig.localProxyUrl;
  // const routerDbConnOptions: ConnectionOptions = {
  //   host: "devinproddemo.com",
  //   port: globalConfig.routerDbProxyPort,
  //   user: "root",
  //   password: "root",
  //   database: "devinproddemo",
  // };
  const routerDbConnOptions: ConnectionOptions = {
    host: "localhost",
    port: 3306,
    user: "root",
    password: "root",
    database: "devinproddemo",
  };
  const localDbPort = globalConfig.routerDbProxyPort;

  localProxyMain(
    globalConfig.localProxyPort,
    process.env.APPLICATION_SECRET,
    routerApiUrl,
    routerWsUrl,
    routerDbConnOptions,
    localServiceUrl,
    localDbPort
  );
}
