import { Closeable, start } from "dev-in-prod-lib/src/appServer";
import { globalConfig } from "../lib/src/globalConfig";
import next from "next";

export const main = (port: number): Promise<Closeable> => {
  // TODO create local client id
  return start(port, __dirname, next);
};

if (require.main == module) {
  main(globalConfig.localProxyPort);
}
