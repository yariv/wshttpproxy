import { startSidecar } from "./src/server";
import { globalConfig } from "../lib/src/globalConfig";

if (require.main == module) {
  //startSidecar(globalConfig.sidecarPort, process.env.APPLICATION_SECRET);
  console.log("TODO");
}
