import { start } from "./src/server";
import { globalConfig } from "../shared/src/globalConfig";

if (require.main == module) {
  start(globalConfig.sidecarPort);
}
