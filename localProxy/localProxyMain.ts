import { AppServer, appServerStart } from "dev-in-prod-lib/src/appServer";
import { globalConfig } from "dev-in-prod-lib/src/utils";
import dotenv from "dotenv";
import next from "next";
import { initLocalProxyApp as initLocalProxyApp, wsWrapper } from "./src/app";
dotenv.config();

export const localProxyMain = async (
  port: number,
  applicationSecret: string,
  routerWsUrl: string
): Promise<AppServer> => {
  // TODO create local client id
  const app = await initLocalProxyApp(applicationSecret, routerWsUrl);
  const appServer = await appServerStart(port, __dirname, next, app);

  appServer.onClose(async () => wsWrapper.ws.close());
  return appServer;
};

if (require.main == module) {
  if (!process.env.APPLICATION_SECRET) {
    throw new Error("Missing APPLICATION_SECRET environment variable.");
  }

  const routerWsUrl = "TODO";
  localProxyMain(
    globalConfig.localProxyPort,
    process.env.APPLICATION_SECRET,
    routerWsUrl
  );
}
