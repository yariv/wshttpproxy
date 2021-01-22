import { main as exampleMain } from "dev-in-prod-example/main";
import { main as sidecarMain } from "dev-in-prod-sidecar/main";
import { main as routerMain } from "dev-in-prod-router/main";
import { main as localProxyMain } from "dev-in-prod-local-proxy/main";
import { globalConfig } from "dev-in-prod-lib/src/globalConfig";
import { CloseableContainer, Closeable } from "dev-in-prod-lib/src/appServer";
import axios, { AxiosPromise } from "axios";

describe("integration", () => {
  let closeables: Closeable[];
  let promises: Promise<any>[];

  beforeEach(() => {
    closeables = [];
    promises = [];
  });

  afterEach(async () => {
    await new CloseableContainer(closeables).close();
    closeables = [];
    promises = [];
  });

  const deferClose = (closeable: Closeable) => {
    closeables.push(closeable);
  };

  it("sidecar works", async () => {
    // sidecar should return 500 if the prod service is offline
    deferClose(await sidecarMain(globalConfig.sidecarPort));
    try {
      const resp = await axios(globalConfig.sidecarUrl);
      fail();
    } catch (err) {
      expect(err.response.status).toBe(500);
    }

    // start the prod service and verify it works
    deferClose(exampleMain(globalConfig.exampleProdPort));

    const resp2 = await axios(globalConfig.exampleProdUrl);
    expect(resp2.status).toBe(200);
    expect(resp2.data).toBe(globalConfig.exampleProdPort);

    // sidecar should successfully forward standard requests to prod service
    const resp3 = await axios(globalConfig.sidecarUrl);
    expect(resp3.status).toBe(resp2.status);
    expect(resp3.data).toBe(resp2.data);

    const sendDevRequest = (): AxiosPromise => {
      // send a dev request, verify it fails because the router hasn't been started
      return axios(globalConfig.sidecarUrl, {
        headers: { [globalConfig.devInProdHeader]: "true" },
      });
    };

    try {
      const resp4 = await sendDevRequest();
      fail();
    } catch (err) {
      expect(err.response.status).toBe(500);
    }

    deferClose(await routerMain(globalConfig.routerPort));
  });

  it("works", async () => {
    return;
    const mainPromises: Promise<any>[] = [];
    exampleMain(globalConfig.exampleDevPort);
    exampleMain(globalConfig.exampleProdPort);
    sidecarMain(globalConfig.sidecarPort);
    mainPromises.push(routerMain(globalConfig.routerPort));
    mainPromises.push(localProxyMain(globalConfig.localProxyPort));

    const cloeasbles = await Promise.all(mainPromises);

    const resp = await fetch(globalConfig.sidecarUrl);
    console.log(resp);
    await new CloseableContainer(cloeasbles).close();
  });
});
