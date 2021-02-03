import { main as exampleMain } from "dev-in-prod-example/main";
import { startSidecar } from "dev-in-prod-sidecar/src/sidecarServer";
import { main as routerMain } from "dev-in-prod-router/main";
import { main as localProxyMain } from "dev-in-prod-local-proxy/main";
import { getRouterApiUrl, globalConfig } from "dev-in-prod-lib/src/utils";
import {
  CloseableContainer,
  Closeable,
  start,
} from "dev-in-prod-lib/src/appServer";
// TODO fix import
import { TypedHttpClient } from "../../../router/src/typedApi/httpApi";
import { routerApiSchema } from "dev-in-prod-router/src/routerApiSchema";
import { createTestOAuthToken } from "dev-in-prod-router/src/tests/testLib";
import { prisma } from "dev-in-prod-router/src/prisma";
import { localProxyApiSchema } from "dev-in-prod-local-proxy/src/localProxyApiSchema";
import { log } from "dev-in-prod-lib/src/log";

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
    await prisma.$disconnect();
  });

  const deferClose = (closeable: Closeable) => {
    closeables.push(closeable);
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
    deferClose(exampleMain(globalConfig.exampleProdPort));

    const resp2 = await sendRequest(globalConfig.exampleProdUrl);
    expect(resp2.status).toBe(200);
    expect(resp2.body).toBe("" + globalConfig.exampleProdPort);
  });

  it("sidecar works", async () => {
    // sidecar should return 500 if the prod service is offline
    deferClose(await startSidecar(globalConfig.sidecarPort, "secret"));
    await expectHttpError(sendRequest(globalConfig.sidecarUrl), 500);

    deferClose(exampleMain(globalConfig.exampleProdPort));

    // sidecar should forward standard requests to prod service
    const resp3 = await sendRequest(globalConfig.sidecarUrl);
    expect(resp3.status).toBe(200);
    expect(resp3.body).toBe("" + globalConfig.exampleProdPort);
  });

  it("routing works", async () => {
    deferClose(await routerMain(globalConfig.routerPort));

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

    deferClose(await exampleMain(globalConfig.exampleProdPort));
    deferClose(await startSidecar(globalConfig.sidecarPort, applicationSecret));

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

    deferClose(
      await localProxyMain(globalConfig.localProxyPort, applicationSecret)
    );

    const localProxyClient = new TypedHttpClient(
      globalConfig.localProxyUrl + globalConfig.apiPathPrefix,
      localProxyApiSchema
    );
    await localProxyClient.post("setToken", { token: oauthToken });
    await localProxyClient.post("setRouteKey", { routeKey });
    deferClose(await exampleMain(globalConfig.exampleDevPort));

    const resp2 = await sendDevRequest();
    log("resp", resp2);
    expect(resp2.body).toBe("" + globalConfig.exampleDevPort);
    expect(resp2.status).toBe(200);

    //await expectHttpError(sendDevRequest(), 404);
  });
});
