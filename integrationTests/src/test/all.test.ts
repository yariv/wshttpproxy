import { exampleMain as exampleMain } from "dev-in-prod-example/main";
import { getRouterApiUrl, globalConfig } from "dev-in-prod-lib/src/utils";
import { localProxyMain as localProxyMain } from "dev-in-prod-local-proxy/localProxyMain";
import { localProxyApiSchema } from "dev-in-prod-local-proxy/src/localProxyApiSchema";
import { routerMain } from "dev-in-prod-router/routerMain";
import { prisma } from "dev-in-prod-router/src/prisma";
import { routerApiSchema } from "dev-in-prod-router/src/routerApiSchema";
import { createTestOAuthToken } from "dev-in-prod-router/src/tests/testLib";
import { startSidecar } from "dev-in-prod-sidecar/src/sidecarServer";
// TODO fix import
import { TypedHttpClient } from "../../../router/src/typedApi/httpApi";

describe("integration", () => {
  let closeFuncs: (() => Promise<void>)[];

  beforeEach(() => {
    closeFuncs = [];
  });

  afterEach(async () => {
    await Promise.all(closeFuncs.map((func) => func()));
    closeFuncs = [];
    await prisma.$disconnect();
  });

  const defer = (closeFunc: () => Promise<void>) => {
    closeFuncs.push(closeFunc);
  };

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
    defer(exampleMain(globalConfig.exampleProdPort));

    const resp2 = await sendRequest(globalConfig.exampleProdUrl);
    expect(resp2.status).toBe(200);
    expect(resp2.body).toBe("" + globalConfig.exampleProdPort);
  });

  it("sidecar works", async () => {
    // sidecar should return 500 if the prod service is offline
    defer(await startSidecar(globalConfig.sidecarPort, "secret"));
    await expectHttpError(sendRequest(globalConfig.sidecarUrl), 500);

    defer(exampleMain(globalConfig.exampleProdPort));

    // sidecar should forward standard requests to prod service
    const resp3 = await sendRequest(globalConfig.sidecarUrl);
    expect(resp3.status).toBe(200);
    expect(resp3.body).toBe("" + globalConfig.exampleProdPort);
  });

  it("routing works", async () => {
    defer(await routerMain(globalConfig.routerPort));

    const routerClient = new TypedHttpClient(
      getRouterApiUrl(),
      routerApiSchema
    );
    const oauthToken = await createTestOAuthToken();
    const { secret: applicationSecret } = await routerClient.post(
      "createApplication",
      {
        oauthToken,
        name: "foo",
      }
    );

    const res2 = await routerClient.post("createRoute", {
      oauthToken,
      applicationSecret,
    });
    const routeKey = res2.routeKey;

    defer(await exampleMain(globalConfig.exampleProdPort));
    defer(await startSidecar(globalConfig.sidecarPort, applicationSecret));

    const resp = await sendRequest(globalConfig.sidecarUrl);
    expect(resp.status).toBe(200);
    expect(resp.body).toBe("" + globalConfig.exampleProdPort);

    const sendDevRequest = (): ReturnType<typeof sendRequest> =>
      sendRequest(globalConfig.sidecarUrl, {
        [globalConfig.routeKeyHeader]: routeKey,
      });

    // send a dev request, verify it fails because the local proxy isn't connected
    // to the route
    await expectHttpError(sendDevRequest(), 400, "Route isn't connected");

    defer(await localProxyMain(globalConfig.localProxyPort, applicationSecret));

    const localProxyClient = new TypedHttpClient(
      globalConfig.localProxyUrl + globalConfig.apiPathPrefix,
      localProxyApiSchema
    );
    await localProxyClient.post("setToken", { token: oauthToken });
    await localProxyClient.post("setRouteKey", { routeKey });
    defer(await exampleMain(globalConfig.exampleDevPort));

    const resp2 = await sendDevRequest();
    expect(resp2.body).toBe("" + globalConfig.exampleDevPort);
    expect(resp2.status).toBe(200);

    //await expectHttpError(sendDevRequest(), 404);
  });
});
