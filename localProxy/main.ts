import { start } from "./src/server";
import { globalConfig } from "../shared/src/globalConfig";

(async () => {
  await start(globalConfig.localProxyPort);
})();
