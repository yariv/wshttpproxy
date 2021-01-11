import { start } from "./src/server";
import { globalConfig } from "../lib/src/globalConfig";
import { Closeable } from "dev-in-prod-lib/src/appServer";

export const main = (port: number): Promise<Closeable> => {
  return start(port, __dirname);
};

if (require.main == module) {
  main(globalConfig.routerPort);
}
