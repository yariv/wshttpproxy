import { main as exampleMain } from "../../../example/src/main";
import { main as sidecarMain } from "../../../sidecar/src/main";
import { main as wwwMain } from "../../../www/src/main";
import { main as localProxyMain } from "../../../localProxy/src/main";

describe("all", () => {
  it("works", async () => {
    await exampleMain();
    await sidecarMain();
    await wwwMain();
    await localProxyMain();
    console.log("b");
  });
});
