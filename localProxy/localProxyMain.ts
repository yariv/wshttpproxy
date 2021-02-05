import { appServerStart } from "dev-in-prod-lib/src/appServer";
import dotenv from "dotenv";
import next from "next";
import { globalConfig } from "dev-in-prod-lib/src/utils";
import { initKoaApp as initKoaApp, wsWrapper } from "./src/app";
dotenv.config();

export const localProxyMain = async (
  port: number,
  applicationSecret: string
): Promise<() => Promise<void>> => {
  // TODO create local client id
  const app = await initKoaApp(applicationSecret);
  const closeFunc = await appServerStart(port, __dirname, next, app);
  return async () => {
    wsWrapper.ws.close();
    await closeFunc();
  };
};

if (require.main == module) {
  if (!process.env.APPLICATION_SECRET) {
    throw new Error("Missing APPLICATION_SECRET environment variable.");
  }
  localProxyMain(globalConfig.localProxyPort, process.env.APPLICATION_SECRET);
}
