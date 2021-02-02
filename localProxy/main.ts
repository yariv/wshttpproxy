import { Closeable, start } from "dev-in-prod-lib/src/appServer";
import dotenv from "dotenv";
import next from "next";
import { globalConfig } from "../lib/src/utils";
import { initKoaApp as initKoaApp, openWebSocket } from "./src/app";
dotenv.config();

export const main = async (
  port: number,
  applicationSecret: string
): Promise<Closeable> => {
  // TODO create local client id
  const app = await initKoaApp(applicationSecret);
  const closeable = await start(port, __dirname, next, app);
  return {
    close: async () => {
      if (openWebSocket) {
        openWebSocket.ws.close();
      }
      return closeable.close();
    },
  };
};

if (require.main == module) {
  if (!process.env.APPLICATION_SECRET) {
    throw new Error("Missing APPLICATION_SECRET environment variable.");
  }
  main(globalConfig.localProxyPort, process.env.APPLICATION_SECRET);
}
