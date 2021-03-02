import { exampleMain as exampleMain } from "dev-in-prod-example/exampleMain";
import { routerApiSchema } from "dev-in-prod-lib/src/routerApiSchema";
import { setupTest } from "dev-in-prod-lib/src/testLib";
import {
  genNewToken,
  getHttpUrl,
  globalConfig,
} from "dev-in-prod-lib/src/utils";
import { localProxyMain as localProxyMain } from "dev-in-prod-local-proxy/localProxyMain";
import { routerMain } from "dev-in-prod-router/routerMain";
import { getRouteKey } from "dev-in-prod-router/src/utils";
import { startSidecar } from "dev-in-prod-sidecar/src/sidecarServer";
import portfinder from "portfinder";
import { TypedHttpClient } from "typed-api/src/httpApi";
import util from "util";

describe("integration", () => {
  const defer = setupTest();

  type Resp = {
    status: number;
    body: string;
    headers: Headers;
  };
  const sendRequest = async (
    url: string,
    extraHeaders?: Record<string, string>
  ): Promise<Resp> => {
    // Note: we're not using axios because it seems to have trouble
    // sending request headers.
    const resp = await fetch(url, {
      headers: extraHeaders,
    });
    const body = await resp.text();
    return { status: resp.status, body, headers: resp.headers };
  };

  const expectHttpError = async (
    promise: Promise<Resp>,
    code: number,
    body?: string
  ) => {
    const resp = await promise;
    expect(resp.status).toBe(code);
    if (body) {
      expect(resp.body).toBe(body);
    }
  };

  const emptyResponse = "<h1>no posts</h1>";
  // TODO move to /example
  it("example works", async () => {
    // start the prod service and verify it works
    const example = await exampleMain(0, 3306);
    defer(example.close.bind(example));

    const resp2 = await sendRequest(example.url);
    expect(resp2.status).toBe(200);
    expect(resp2.body).toBe(emptyResponse);
  });

  it("sidecar works", async () => {
    const exampleProd = await exampleMain(0, 3306);
    defer(exampleProd.close.bind(exampleProd));

    const sideCar = await startSidecar(0, "secret", exampleProd.url, "foo");
    defer(sideCar.close.bind(sideCar));

    // sidecar should forward standard requests to prod service
    const resp3 = await sendRequest(sideCar.url);
    expect(resp3.status).toBe(200);
    expect(resp3.body).toBe(emptyResponse);
  });

  it("routing works", async () => {
    const applicationSecret = genNewToken();
    const [
      routerDbProxyPort,
      localProxyPort,
      localProxyDbPort,
      exampleDevPort,
    ] = await util.promisify(portfinder.getPorts.bind(portfinder))(4, {});

    const dbConnOptions = globalConfig.defaultDbConnOptions;
    const router = await routerMain(
      0,
      applicationSecret,
      routerDbProxyPort,
      dbConnOptions
    );
    defer(router.close.bind(router));

    const routerClient = new TypedHttpClient(router.apiUrl, routerApiSchema);
    const { authToken } = await routerClient.call("createAuthToken");

    const exampleProd = await exampleMain(0, dbConnOptions.port);
    defer(exampleProd.close.bind(exampleProd));

    const sideCar = await startSidecar(
      0,
      applicationSecret,
      exampleProd.url,
      router.url
    );
    defer(sideCar.close.bind(sideCar));

    const resp = await sendRequest(sideCar.url);
    expect(resp.status).toBe(200);
    expect(resp.body).toBe(emptyResponse);

    console.log(localProxyPort, localProxyDbPort, exampleDevPort);
    const localProxy = await localProxyMain(
      localProxyPort,
      router.wsUrl,
      { ...dbConnOptions, port: routerDbProxyPort },
      getHttpUrl(exampleDevPort),
      localProxyDbPort,
      authToken
    );
    defer(localProxy.close.bind(localProxy));

    const exampleDev = await exampleMain(exampleDevPort, localProxyDbPort);
    defer(exampleDev.close.bind(exampleDev));

    const sendDevRequest = (routeKey: string): ReturnType<typeof sendRequest> =>
      sendRequest(sideCar.url, {
        [globalConfig.routeKeyHeader]: routeKey,
      });

    await expectHttpError(
      sendDevRequest("invalid_key"),
      400,
      "Route isn't connected"
    );

    const resp2 = await sendDevRequest(getRouteKey(authToken));
    expect(resp2.body).toBe(emptyResponse);
    expect(resp2.status).toBe(200);
  });
});
