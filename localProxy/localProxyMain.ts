import { AppServer, appServerStart } from "dev-in-prod-lib/src/appServer";
import dotenv from "dotenv";
import next from "next";
import { getRouterWsUrl, globalConfig } from "dev-in-prod-lib/src/utils";
import { initLocalProxyApp as initLocalProxyApp, wsWrapper } from "./src/app";
import { route } from "next/dist/next-server/server/router";
dotenv.config();

export const localProxyMain = async (
  port: number,
  applicationSecret: string,
  routerWsUrl: string
): Promise<AppServer> => {
  // TODO create local client id
  const app = await initLocalProxyApp(applicationSecret, routerWsUrl);
  const { serverPort, closeFunc } = await appServerStart(
    port,
    __dirname,
    next,
    app
  );
  return {
    serverPort,
    closeFunc: async () => {
      wsWrapper.ws.close();
      await closeFunc();
    },
    
  };
};

if (require.main == module) {
  if (!process.env.APPLICATION_SECRET) {
    throw new Error("Missing APPLICATION_SECRET environment variable.");
  }

  const routerWsUrl = getRouterWsUrl(globalConfig.routerPort);
  localProxyMain(
    globalConfig.localProxyPort,
    process.env.APPLICATION_SECRET,
    routerWsUrl
  );
}
