import { exampleMain as exampleMain } from "dev-in-prod-example/exampleMain";
import { routerApiSchema } from "dev-in-prod-lib/src/routerApiSchema";
import { setupTest } from "dev-in-prod-lib/src/testLib";
import { globalConfig } from "dev-in-prod-lib/src/utils";
import { localProxyMain as localProxyMain } from "dev-in-prod-local-proxy/localProxyMain";
import { localProxyApiSchema } from "dev-in-prod-local-proxy/src/localProxyApiSchema";
import { routerMain } from "dev-in-prod-router/routerMain";
import { startSidecar } from "dev-in-prod-sidecar/src/sidecarServer";
import { TypedHttpClient } from "typed-api/src/httpApi";

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

  // TODO move to /example
  it("example works", async () => {
    // start the prod service and verify it works
    const example = await exampleMain(0);
    defer(example.close.bind(example));

    const resp2 = await sendRequest(example.url);
    expect(resp2.status).toBe(200);
    expect(resp2.body).toBe("" + example.port);
  });

  it("sidecar works", async () => {
    const exampleProd = await exampleMain(0);
    defer(exampleProd.close.bind(exampleProd));

    const sideCar = await startSidecar(0, "secret", exampleProd.url, "foo");
    defer(sideCar.close.bind(sideCar));

    // sidecar should forward standard requests to prod service
    const resp3 = await sendRequest(sideCar.url);
    expect(resp3.status).toBe(200);
    expect(resp3.body).toBe("" + exampleProd.port);
  });

  it("routing works", async () => {
    const router = await routerMain(0);
    defer(router.close.bind(router));

    const routerClient = new TypedHttpClient(router.apiUrl, routerApiSchema);
    const { authToken } = await routerClient.call("createTestauthToken");
    const { secret: applicationSecret } = await routerClient.call(
      "createApplication",
      {
        authToken,
        name: "foo",
      }
    );

    const exampleProd = await exampleMain(0);
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
    expect(resp.body).toBe("" + exampleProd.port);

    const exampleDev = await exampleMain(0);
    defer(exampleDev.close.bind(exampleDev));

    const localProxy = await localProxyMain(
      0,
      applicationSecret,
      router.apiUrl,
      router.wsUrl,
      exampleDev.url
    );
    defer(localProxy.close.bind(localProxy));

    const sendDevRequest = (routeKey: string): ReturnType<typeof sendRequest> =>
      sendRequest(sideCar.url, {
        [globalConfig.routeKeyHeader]: routeKey,
      });

    await expectHttpError(
      sendDevRequest("invalid_key"),
      400,
      "Invalid route key"
    );

    const localProxyClient = new TypedHttpClient(
      localProxy.appServer!.apiUrl,
      localProxyApiSchema
    );
    await localProxyClient.call("setToken", { authToken });

    const resp2 = await sendDevRequest(await localProxy.getStored("routeKey"));
    expect(resp2.body).toBe("" + exampleDev.port);
    expect(resp2.status).toBe(200);
  });
});
