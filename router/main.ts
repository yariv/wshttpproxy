import { start } from "./src/routerServer";
import { globalConfig } from "dev-in-prod-lib/src/utils";
import { Closeable } from "dev-in-prod-lib/src/appServer";

export const main = (port: number): Promise<Closeable> => {
  return start(port, __dirname);
};

if (require.main == module) {
  main(globalConfig.routerPort);
}
