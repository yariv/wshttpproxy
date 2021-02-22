import { AppServer, startNextServer } from "dev-in-prod-lib/src/appServer";
import { globalConfig } from "dev-in-prod-lib/src/utils";
import dotenv from "dotenv";
import next from "next";
import { LocalProxy } from "./src/localProxy";
dotenv.config();

export const localProxyMain = async (
  port: number,
  applicationSecret: string,
  routerApiUrl: string,
  routerWsUrl: string,
  localServiceUrl: string
): Promise<LocalProxy> => {
  const localProxy = new LocalProxy(
    applicationSecret,
    routerApiUrl,
    routerWsUrl,
    localServiceUrl
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
  localProxyMain(
    globalConfig.localProxyPort,
    process.env.APPLICATION_SECRET,
    routerApiUrl,
    routerWsUrl,
    localServiceUrl
  );
}
