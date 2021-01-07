import { start } from "./src/start";
import { globalConfig } from "../shared/src/globalConfig";

(async () => {
  await start(globalConfig.examplePort);
})();
