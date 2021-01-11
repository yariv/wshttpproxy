import { main as exampleMain } from "../../../example/main";
import { main as sidecarMain } from "../../../sidecar/main";
import { main as wwwMain } from "../../../www/main";
import { main as localProxyMain } from "../../../localProxy/main";
import { globalConfig } from "dev-in-prod-lib/src/globalConfig";

describe("all", () => {
  it("works", async () => {
    const mainPromises = [];
    mainPromises.push(exampleMain(globalConfig.exampleDevPort));
    mainPromises.push(exampleMain(globalConfig.exampleProdPort));
    mainPromises.push(sidecarMain(globalConfig.sidecarPort));
    mainPromises.push(wwwMain(globalConfig.wwwPort));
    mainPromises.push(localProxyMain(globalConfig.localProxyPort));

    const resp = await fetch(globalConfig.sidecarUrl);
    console.log(resp);
    const cloeasbles = await Promise.all(mainPromises);
    const closeablePromises = cloeasbles.map((closeable) => closeable.close());
    await Promise.all(closeablePromises);

    return;

    // promises.push(exampleStart(globalConfig.exampleProdPort));
    // promises.push(exampleStart(globalConfig.exampleDevPort));
    // // promises.push(sidecarMain(globalConfig.sidecarPort));
    // // promises.push(wwwStart(globalConfig.wwwPort));
    // // promises.push(localProxyStart(globalConfig.localProxyPort));
    // const servers = await Promise.all(promises);
    // const promises2 = servers.map((server) => server.close());
    // console.log(promises2);
    // await Promise.all(promises2);
    // console.log("b");
  });
});
