import { createTestOAuthToken, setupTest } from "dev-in-prod-lib/src/testLib";
import { WsWrapper } from "dev-in-prod-lib/src/typedWs";
import { getRouterApiUrl, globalConfig } from "dev-in-prod-lib/src/utils";
import { clientSchema, serverSchema } from "dev-in-prod-lib/src/wsSchema";
import { routerMain } from "../../routerMain";
import { routerApiSchema } from "../routerApiSchema";
import { TypedHttpClient } from "../typedApi/httpApi";
import WebSocket from "ws";
import * as z from "zod";

describe("proxy middleware", () => {
  const defer = setupTest();
  const client = new TypedHttpClient(getRouterApiUrl(), routerApiSchema);
  let oauthToken: string;
  beforeAll(async () => {
    defer(await routerMain(globalConfig.routerPort));
  });

  beforeEach(async () => {
    oauthToken = await createTestOAuthToken();
  });

  const getAppSecret = async (): Promise<string> => {
    const { secret } = await client.post("createApplication", {
      oauthToken,
      name: "foo",
    });
    return secret;
  };
  const getRouteKey = async (applicationSecret: string): Promise<string> => {
    const { routeKey } = await client.post("createRoute", {
      oauthToken,
      applicationSecret,
    });
    return routeKey;
  };

  const checkRes = async (
    res: Response,
    expectedStatus: number,
    expectedText: string
  ) => {
    expect(res.status).toBe(expectedStatus);
    expect(await res.text()).toStrictEqual(expectedText);
  };

  it("Requires x-forwarded-host header", async () => {
    const res = await fetch(globalConfig.routerUrl, {
      headers: { [globalConfig.appSecretHeader]: "foo" },
    });
    checkRes(res, 400, "Missing x-forwarded-host header");
  });

  it("Requires route key", async () => {
    const originalHost = "http://localhost";
    const res = await fetch(globalConfig.routerUrl, {
      headers: {
        [globalConfig.appSecretHeader]: "foo",
        [globalConfig.originalHostHeader]: originalHost,
      },
    });
    checkRes(res, 400, "Missing route key");
  });

  it("Requires valid app secret", async () => {
    const originalHost = "rk-123.localhost.localhost";
    const res = await fetch(globalConfig.routerUrl, {
      headers: {
        [globalConfig.appSecretHeader]: "foo",
        [globalConfig.originalHostHeader]: originalHost,
      },
    });
    checkRes(res, 400, "Invalid application secret");
  });

  it("Requires valid route key", async () => {
    const applicationSecret = await getAppSecret();
    const originalHost = "rk-123.localhost.localhost";
    const res = await fetch(globalConfig.routerUrl, {
      headers: {
        [globalConfig.appSecretHeader]: applicationSecret,
        [globalConfig.originalHostHeader]: originalHost,
      },
    });
    checkRes(res, 400, "Invalid route key");
  });

  it("Parses route key from original host or header", async () => {
    const applicationSecret = await getAppSecret();
    const routeKey = await getRouteKey(applicationSecret);
    const originalHost = `${globalConfig.routeKeySubdomainPrefix}${routeKey}.localhost.localhost`;
    const res = await fetch(globalConfig.routerUrl, {
      headers: {
        [globalConfig.appSecretHeader]: applicationSecret,
        [globalConfig.originalHostHeader]: originalHost,
      },
    });
    checkRes(res, 400, "Route isn't connected");

    const res2 = await sendProxyRequest(applicationSecret, routeKey);
    checkRes(res2, 400, "Route isn't connected");
  });

  const bodyStr = "a=1";
  const testPath = "/testPath";

  const openWs = async (): Promise<
    WsWrapper<typeof serverSchema, typeof clientSchema>
  > => {
    const ws = new WebSocket(globalConfig.routerWsUrl);
    const wsWrapper = new WsWrapper(ws, serverSchema, clientSchema);

    return new Promise((resolve) => {
      wsWrapper.ws.on("open", () => {
        resolve(wsWrapper);
      });
    });
  };

  const sendProxyRequest = (applicationSecret: string, routeKey:string): Promise<Response> => {
    return fetch(globalConfig.routerUrl + testPath, {
          headers: {
            [globalConfig.appSecretHeader]: applicationSecret,
            [globalConfig.originalHostHeader]: "localhost",
            [globalConfig.routeKeyHeader]: routeKey,
          },
          method: "POST",
          body: bodyStr,
        });
  }

  it("Forwards proxy request", async () => {
    const applicationSecret = await getAppSecret();
    const routeKey = await getRouteKey(applicationSecret);
    const wsWrapper = await openWs();

    return new Promise((resolve) => {
      wsWrapper.setHandler(
        "proxy",
        async ({ body, path, requestId, headers }) => {
          expect(body).toStrictEqual(bodyStr);
          expect(path).toStrictEqual(testPath);
          expect(requestId).toBeTruthy();
          expect(headers[globalConfig.originalHostHeader]).toStrictEqual(
            "localhost"
          );
          expect(headers["host"]).toStrictEqual(
            "localhost:" + globalConfig.routerPort
          );
          expect(headers["content-length"]).toStrictEqual("" + bodyStr.length);
          resolve(null);
        }
      );
      wsWrapper.setHandler("connected", async () => {
        const res2 = await sendProxyRequest(applicationSecret, routeKey);
        // the server shuts down, triggering this error
        checkRes(res2, 500, "Proxy error");
      });
      wsWrapper.sendMsg("connect", {
        routeKey,
        applicationSecret,
        oauthToken,
      });
    });
  });

  const testConnectError = async (
    request: z.infer<typeof clientSchema["connect"]>,
    expectedErr: string
  ) => {
    const wsWrapper = await openWs();
    return new Promise((resolve) => {
      wsWrapper.setHandler("connectionError", async ({ message }) => {
        expect(message).toBe(expectedErr);
        resolve(null);
      });
      wsWrapper.sendMsg("connect", request);
    });
  };

  it("connect requires valid oauth token", async () => {
    await testConnectError(
      {
        oauthToken: "baz",
        applicationSecret: "foo",
        routeKey: "bar",
      },
      "Invalid oauth token"
    );
  });

  it("connect requires valid application secret", async () => {
    await testConnectError(
      {
        oauthToken,
        applicationSecret: "foo",
        routeKey: "bar",
      },
      "Invalid application secret"
    );
  });

  it("connect requires valid route key", async () => {
    const applicationSecret = await getAppSecret();
    await testConnectError(
      {
        oauthToken,
        applicationSecret,
        routeKey: "bar",
      },
      "Invalid route key"
    );
  });
  it("only one websocket per route key", async () => {
    const applicationSecret = await getAppSecret();
    const routeKey = await getRouteKey(applicationSecret);
    const wsWrapper = await openWs();
    const wsWrapper2 = await openWs();
    let firstClosed = false;
    return new Promise((resolve) => {
      wsWrapper.ws.on("close", () => {
        firstClosed = true;
        resolve(null);
      });
      wsWrapper2.ws.on("close", () => {
        if (!firstClosed) {
          fail();
        }
      });
      wsWrapper.sendMsg("connect", {
        oauthToken,
        applicationSecret,
        routeKey,
      });
      wsWrapper2.sendMsg("connect", {
        oauthToken,
        applicationSecret,
        routeKey,
      });
    });
  });


  it("Forwards proxy result", async () => {
    const applicationSecret = await getAppSecret();
    const routeKey = await getRouteKey(applicationSecret);
    const wsWrapper = await openWs();

    return new Promise((resolve) => {
      wsWrapper.setHandler(
        "proxy",
        async ({ body, path, requestId, headers }) => {
          wsWrapper.sendMsg("proxyResult", {body: "result", requestId, status: 231, statusText: "sup", headers: {foo: "bar"}});
          resolve(null);
        }
      );
      wsWrapper.setHandler("connected", async () => {

        // the server shuts down, triggering this error
        checkRes(res2, 500, "Proxy error");
      });
      wsWrapper.sendMsg("connect", {
        routeKey,
        applicationSecret,
        oauthToken,
      });
    });
});
