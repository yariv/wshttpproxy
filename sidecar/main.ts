import { startSidecar } from "./src/server";
import { globalConfig } from "dev-in-prod-lib/src/utils";

if (require.main == module) {
  //startSidecar(globalConfig.sidecarPort, process.env.APPLICATION_SECRET);
  console.log("TODO");
}
