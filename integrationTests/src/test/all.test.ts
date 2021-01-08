import { start as exampleStart } from "../../../example/src/server";
import { start as sidecarMain } from "../../../sidecar/src/server";
import { start as wwwStart } from "../../../www/src/server";
import { start as localProxyStart } from "../../../localProxy/src/server";
import { globalConfig } from "../../../shared/src/globalConfig";

describe("all", () => {
  it("works", async () => {
    await exampleStart(globalConfig.examplePort);
    await sidecarMain(globalConfig.sidecarPort);
    await wwwStart(globalConfig.wwwPort);
    await localProxyStart(globalConfig.localProxyPort);
    console.log("b");
  });
});
