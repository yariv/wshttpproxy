import { start } from "./src/server";
import { globalConfig } from "../shared/src/globalConfig";

// We do this for consistency with the other services
export const main = start;

if (require.main == module) {
  main(globalConfig.sidecarPort);
}
