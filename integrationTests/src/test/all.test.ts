import { main as exampleMain } from "dev-in-prod-example/main";
import { main as sidecarMain } from "dev-in-prod-sidecar/main";
import { main as routerMain } from "dev-in-prod-router/main";
import { main as localProxyMain } from "dev-in-prod-local-proxy/main";
import { globalConfig } from "dev-in-prod-lib/src/globalConfig";
import { CloseableContainer } from "dev-in-prod-lib/src/appServer";

describe("all", () => {
  it("works", async () => {
    const mainPromises = [];
    mainPromises.push(exampleMain(globalConfig.exampleDevPort));
    mainPromises.push(exampleMain(globalConfig.exampleProdPort));
    mainPromises.push(sidecarMain(globalConfig.sidecarPort));
    mainPromises.push(routerMain(globalConfig.routerPort));
    mainPromises.push(localProxyMain(globalConfig.localProxyPort));

    const cloeasbles = await Promise.all(mainPromises);

    const resp = await fetch(globalConfig.sidecarUrl);
    console.log(resp);
    await new CloseableContainer(cloeasbles).close();
  });
});
