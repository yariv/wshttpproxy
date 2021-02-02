import { Closeable, start } from "dev-in-prod-lib/src/appServer";
import { globalConfig } from "../lib/src/utils";
import next from "next";
import dotenv from "dotenv";
import { initKoaApp } from "./src/app";
dotenv.config();

export const main = (
  port: number,
  applicationSecret: string
): Promise<Closeable> => {
  // TODO create local client id
  return start(port, __dirname, next, initKoaApp(applicationSecret));
};

if (require.main == module) {
  if (!process.env.APPLICATION_SECRET) {
    throw new Error("Missing APPLICATION_SECRET environment variable.");
  }
  main(globalConfig.localProxyPort, process.env.APPLICATION_SECRET);
}
