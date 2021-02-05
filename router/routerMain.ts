import { routerServerStart } from "./src/routerServer";
import { globalConfig } from "dev-in-prod-lib/src/utils";

export const routerMain = (port: number): Promise<() => Promise<void>> => {
  return routerServerStart(port, __dirname);
};

if (require.main == module) {
  routerMain(globalConfig.routerPort);
}
