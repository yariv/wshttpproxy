import { routerServerStart } from "./src/routerServer";
import { globalConfig } from "dev-in-prod-lib/src/utils";
import { AppServer } from "dev-in-prod-lib/src/appServer";

export const routerMain = (port: number): Promise<AppServer> => {
  return routerServerStart(port, __dirname);
};

if (require.main == module) {
  routerMain(globalConfig.routerPort);
}
