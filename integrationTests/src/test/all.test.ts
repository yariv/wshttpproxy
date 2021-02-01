import { main as exampleMain } from "dev-in-prod-example/main";
import { startSidecar } from "dev-in-prod-sidecar/src/server";
import { main as routerMain } from "dev-in-prod-router/main";
import { main as localProxyMain } from "dev-in-prod-local-proxy/main";
import { getRouterApiUrl, globalConfig } from "dev-in-prod-lib/src/utils";
import {
  CloseableContainer,
  Closeable,
  start,
} from "dev-in-prod-lib/src/appServer";
import axios, { AxiosPromise } from "axios";
// TODO fix import
import { TypedHttpClient } from "../../../router/src/typedApi/httpApi";
import { typedApiSchema } from "dev-in-prod-router/src/typedApiSchema";
import { createTestOAuthToken } from "dev-in-prod-router/src/tests/testLib";

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

  const expectHttpError = async (promise: AxiosPromise, code: number) => {
    try {
      const resp = await promise;
      console.log(resp.status);
      console.log(resp.data);
      fail();
    } catch (err) {
      expect(err.response.status).toBe(code);
    }
  };

  it("example works", async () => {
    // start the prod service and verify it works
    deferClose(exampleMain(globalConfig.exampleProdPort));

    const resp2 = await axios(globalConfig.exampleProdUrl);
    expect(resp2.status).toBe(200);
    expect(resp2.data).toBe(globalConfig.exampleProdPort);
  });

  it("sidecar works", async () => {
    // sidecar should return 500 if the prod service is offline
    deferClose(await startSidecar(globalConfig.sidecarPort, "secret"));
    await expectHttpError(axios(globalConfig.sidecarUrl), 500);

    deferClose(exampleMain(globalConfig.exampleProdPort));

    // sidecar should forward standard requests to prod service
    const resp3 = await axios(globalConfig.sidecarUrl);
    expect(resp3.status).toBe(200);
    expect(resp3.data).toBe(globalConfig.exampleProdPort);
  });

  it("routing works", async () => {
    deferClose(await routerMain(globalConfig.routerPort));

    const routerClient = new TypedHttpClient(getRouterApiUrl(), typedApiSchema);
    const oauthToken = await createTestOAuthToken();
    const res = await routerClient.post("createApplication", {
      oauthToken,
      name: "foo",
    });
    const secret = res.secret;

    deferClose(await startSidecar(globalConfig.sidecarPort, secret));

    const res2 = await routerClient.post("createRoute", {
      oauthToken,
      applicationSecret: secret,
    });
    const routeKey = res2.routeKey;

    const sendDevRequest = (): AxiosPromise => {
      return axios(globalConfig.sidecarUrl, {
        headers: { [globalConfig.routeKeyHeader]: routeKey },
      });
    };
    // send a dev request, verify it fails because the router hasn't been started
    await expectHttpError(sendDevRequest(), 500);

    deferClose(await routerMain(globalConfig.routerPort));
    await expectHttpError(sendDevRequest(), 404);
  });
});
