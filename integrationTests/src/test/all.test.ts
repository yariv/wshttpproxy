import { start as exampleStart } from "../../../example/src/server";
import { start as sidecarMain } from "../../../sidecar/src/server";
import { start as wwwStart } from "../../../www/src/server";
import { start as localProxyStart } from "../../../localProxy/src/server";
import { globalConfig } from "../../../shared/src/globalConfig";

describe("all", () => {
  afterAll(() => {
    console.log("c");
    //process.exit(0);
  });

  it("works", async () => {
    const promises = [];
    const server = await exampleStart(globalConfig.exampleProdPort);
    await server.close();
    return;

    promises.push(exampleStart(globalConfig.exampleProdPort));
    promises.push(exampleStart(globalConfig.exampleDevPort));
    // promises.push(sidecarMain(globalConfig.sidecarPort));
    // promises.push(wwwStart(globalConfig.wwwPort));
    // promises.push(localProxyStart(globalConfig.localProxyPort));
    const servers = await Promise.all(promises);
    const promises2 = servers.map((server) => server.close());
    console.log(promises2);
    await Promise.all(promises2);
    console.log("b");
  });
});
