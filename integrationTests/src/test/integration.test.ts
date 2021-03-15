import { TypedHttpClient } from "infer-rpc/dist/httpClient";
import Koa from "koa";
import Router from "koa-router";
import { listenOnPort } from "lib/src/appServer";
import fetch from "node-fetch";
import portfinder from "portfinder";
import "util";
import util from "util";
import { routerApiSchema } from "../../../lib/src/routerApiSchema";
import { setupTest } from "../../../lib/src/testLib";
import {
  genNewToken,
  getHttpUrl as getLocalhostUrl,
  globalConfig,
} from "../../../lib/src/utils";
import { startReverseProxy as startReverseProxy } from "../../../reverseProxy/src/reverseProxy";
import { wsClientMain as wsClientMain } from "../../../wsClient/wsClientMain";
import { getRouteKey } from "../../../wsServer/src/utils";
import { routerMain as wsServerMain } from "../../../wsServer/wsServerMain";

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
    return { status: resp.status, body, headers: resp.headers as any };
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

  it("sidecar works", async () => {
    const testAppPort = await portfinder.getPortPromise();
    await createTestApp(testAppPort);

    const reverseProxyPort = await portfinder.getPortPromise();
    const reverseProxy = await startReverseProxy(
      reverseProxyPort,
      "secret",
      getLocalhostUrl(testAppPort),
      getLocalhostUrl(0)
    );
    defer(reverseProxy.close.bind(reverseProxy));

    // sidecar should forward standard requests to prod service
    const resp3 = await sendRequest(reverseProxy.url);
    expect(resp3.status).toBe(200);
    expect(resp3.body).toBe("" + testAppPort);
  });

  const createTestApp = async (port: number) => {
    const koa = new Koa();
    const router = new Router();
    router.get("/", async (ctx) => {
      ctx.body = "" + port;
    });
    koa.use(router.routes()).use(router.allowedMethods());
    const server = await listenOnPort(koa, port);
    defer(util.promisify(server.close.bind(server)));
  };

  it("routing works", async () => {
    const routingSecret = genNewToken();
    const [
      routerDbProxyPort,
      testAppDevPort,
      testAppProdPort,
    ] = await util.promisify(portfinder.getPorts.bind(portfinder))(3, {
      startPort: 9000, // prevents race conditions with other tests
    });

    const dbConnOptions = globalConfig.defaultDbConnOptions;
    const router = await wsServerMain(0, routingSecret);
    defer(router.close.bind(router));

    const routerClient = new TypedHttpClient(router.apiUrl, routerApiSchema);
    const { authToken } = await routerClient.call("createAuthToken");

    await createTestApp(testAppProdPort);

    const sideCar = await startReverseProxy(
      0,
      routingSecret,
      getLocalhostUrl(testAppProdPort),
      router.url
    );
    defer(sideCar.close.bind(sideCar));

    const resp = await sendRequest(sideCar.url);
    expect(resp.status).toBe(200);
    expect(resp.body).toBe("" + testAppProdPort);

    const wsClient = await wsClientMain(
      router.wsUrl,
      getLocalhostUrl(testAppDevPort),
      authToken
    );
    defer(wsClient.close.bind(wsClient));

    await createTestApp(testAppDevPort);

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
    expect(resp2.body).toBe("" + testAppDevPort);
    expect(resp2.status).toBe(200);

    const resp4 = await sendRequest(sideCar.url);
    expect(resp4.status).toBe(200);
    expect(resp4.body).toBe("" + testAppProdPort);
  });
});
