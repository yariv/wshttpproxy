import { startSidecar } from "./src/sidecarServer";
import { globalConfig } from "dev-in-prod-lib/dist/utils";

if (require.main == module) {
  //startSidecar(globalConfig.sidecarPort, process.env.APPLICATION_SECRET);
  console.log("TODO");
}
