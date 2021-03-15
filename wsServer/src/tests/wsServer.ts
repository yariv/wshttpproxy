import { AppServer } from "../../../lib/src/appServer";
import { routerApiSchema } from "../../../lib/src/routerApiSchema";
import { setupTest } from "../../../lib/src/testLib";
import { WsWrapper } from "../../../lib/src/typedWs";
import { globalConfig } from "../../../lib/src/utils";
import { clientSchema, serverSchema } from "../../../lib/src/wsSchema";
import { TypedHttpClient } from "infer-rpc/dist/httpClient";
import WebSocket from "ws";
import * as z from "zod";
import { getRouteKey } from "../utils";
import { setupRouterTest } from "./utils";
import fetch, { Response } from "node-fetch";

type TestWsType = WsWrapper<typeof serverSchema, typeof clientSchema>;

describe("wsServer", () => {
  let client: TypedHttpClient<typeof routerApiSchema>;
  let routerUrl: string;
  let appServer: AppServer;
  let authToken: string;
  let routingSecret: string;

  const defer = setupTest();

  beforeAll(async () => {
    const {
      client: client1,
      appServer: appServer1,
      routingSecret: routingSecret1,
    } = await setupRouterTest(defer);
    client = client1;
    appServer = appServer1;
    routerUrl = appServer.url;
    routingSecret = routingSecret1;
  });

  beforeEach(async () => {
    const { authToken: token } = await client.call("createAuthToken");
    authToken = token;
  });

  const checkRes = async (
    res: Response,
    expectedStatus: number,
    expectedText: string
  ) => {
    expect(res.status).toBe(expectedStatus);
    expect(await res.text()).toStrictEqual(expectedText);
  };

  it("Requires x-forwarded-host header", async () => {
    const res = await fetch(routerUrl, {
      headers: { [globalConfig.routingSecretHeader]: routingSecret },
    });
    await checkRes(res, 400, "Missing x-forwarded-host header");
  });

  it("Requires route key", async () => {
    const originalHost = "http://localhost";
    const res = await fetch(routerUrl, {
      headers: {
        [globalConfig.routingSecretHeader]: routingSecret,
        [globalConfig.originalHostHeader]: originalHost,
      },
    });
    await checkRes(res, 400, "Missing route key");
  });

  it("Requires valid app secret", async () => {
    const originalHost = "rk-123.localhost.localhost";
    const res = await fetch(routerUrl, {
      headers: {
        [globalConfig.routingSecretHeader]: "foo",
        [globalConfig.originalHostHeader]: originalHost,
      },
    });
    await checkRes(res, 400, "Invalid application secret");
  });

  const getroutingSecret = (): string => {
    return process.env.ROUTING_SECRET!;
  };

  it("Requires valid route key", async () => {
    const originalHost = "rk-123.localhost.localhost";
    const res = await fetch(routerUrl, {
      headers: {
        [globalConfig.routingSecretHeader]: routingSecret,
        [globalConfig.originalHostHeader]: originalHost,
        [globalConfig.routeKeyHeader]: "foo",
      },
    });
    await checkRes(res, 400, "Route isn't connected");
  });

  it("Parses route key from original host or header", async () => {
    const routeKey = getRouteKey(authToken);
    const originalHost = `www-rk-${routeKey}.localhost.localhost`;
    const res = await fetch(routerUrl, {
      headers: {
        [globalConfig.routingSecretHeader]: routingSecret,
        [globalConfig.originalHostHeader]: originalHost,
      },
    });
    await checkRes(res, 400, "Route isn't connected");

    const res2 = await sendProxyRequest(routingSecret, routeKey);
    await checkRes(res2, 400, "Route isn't connected");
  });

  const bodyStr = "a=1";
  const testPath = "/testPath";

  const openWs = async (): Promise<TestWsType> => {
    const ws = new WebSocket(appServer.wsUrl);
    const wsWrapper = new WsWrapper(ws, serverSchema, clientSchema);

    return new Promise((resolve) => {
      wsWrapper.ws.on("open", () => {
        resolve(wsWrapper);
      });
    });
  };

  const sendProxyRequest = (
    routingSecret: string,
    routeKey: string
  ): Promise<Response> => {
    return fetch(routerUrl + testPath, {
      headers: {
        [globalConfig.routingSecretHeader]: routingSecret,
        [globalConfig.originalHostHeader]: "localhost",
        [globalConfig.routeKeyHeader]: routeKey,
      },
      method: "POST",
      body: bodyStr,
    });
  };

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
        authToken: "abcdefg",
      },
      "Invalid oauth token"
    );
  });

  it("Only one websocket per route key", async () => {
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
        authToken,
      });
      wsWrapper2.sendMsg("connect", {
        authToken,
      });
    });
  });

  const getConnectedWs = async (authToken: string): Promise<TestWsType> => {
    const wsWrapper = await openWs();
    return new Promise((resolve) => {
      wsWrapper.setHandler("connected", async () => {
        resolve(wsWrapper);
      });
      wsWrapper.sendMsg("connect", {
        authToken,
      });
    });
  };

  const initConnectedTest = async (): Promise<{
    routeKey: string;
    wsWrapper: TestWsType;
  }> => {
    const routeKey = getRouteKey(authToken);
    const wsWrapper = await getConnectedWs(authToken);
    return { routeKey, wsWrapper };
  };

  it("Forwards proxy request", async () => {
    const { routeKey, wsWrapper } = await initConnectedTest();
    return new Promise(async (resolve) => {
      wsWrapper.setHandler(
        "proxy",
        async ({ body, path, requestId, headers }) => {
          expect(body).toStrictEqual(bodyStr);
          expect(path).toStrictEqual(testPath);
          expect(requestId).toBeTruthy();
          expect(headers[globalConfig.originalHostHeader]).toStrictEqual(
            "localhost"
          );
          expect(headers["host"]).toStrictEqual("localhost:" + appServer.port);
          expect(headers["content-length"]).toStrictEqual("" + bodyStr.length);
          resolve(null);
        }
      );
      const resp = await sendProxyRequest(routingSecret, routeKey);
      await checkRes(resp, 500, "Proxy error");
    });
  });

  it("proxyResult requires valid requestId", async () => {
    const { wsWrapper } = await initConnectedTest();
    return new Promise(async (resolve) => {
      wsWrapper.setHandler("invalidRequestId", async ({ requestId }) => {
        expect(requestId).toBe("foo");
        resolve(null);
      });
      wsWrapper.sendMsg("proxyResult", {
        body: "",
        requestId: "foo",
        status: 200,
        headers: {},
      });
    });
  });

  const testBody = "test";
  const testHeaders = { foo: "bar" };
  const sendProxyResult = (
    wsWrapper: TestWsType,
    requestId: string,
    body: string = testBody
  ) => {
    wsWrapper.sendMsg("proxyResult", {
      body,
      requestId,
      status: 213,
      headers: testHeaders,
    });
  };

  it("proxyResult works", async () => {
    const { routeKey, wsWrapper } = await initConnectedTest();
    wsWrapper.setHandler("proxy", async ({ requestId }) => {
      sendProxyResult(wsWrapper, requestId);
    });
    const resp = await sendProxyRequest(routingSecret, routeKey);
    await checkRes(resp, 213, testBody);
    expect(resp.headers.get("foo")).toStrictEqual("bar");
  });

  const checkOnlyOneMessagePerProxyResult = async (
    sendClientMessage1: (wsWrapper: TestWsType, requestId: string) => void,
    sendClientMessage2: (wsWrapper: TestWsType, requestId: string) => void
  ) => {
    const { routeKey, wsWrapper } = await initConnectedTest();
    return new Promise(async (resolve) => {
      wsWrapper.setHandler("proxy", async ({ requestId }) => {
        wsWrapper.setHandler(
          "invalidRequestId",
          async ({ requestId: errRequestId }) => {
            expect(errRequestId).toStrictEqual(requestId);
            resolve(null);
          }
        );

        sendClientMessage1(wsWrapper, requestId);
        sendClientMessage2(wsWrapper, requestId);
      });
      await sendProxyRequest(routingSecret, routeKey);
    });
  };

  const proxyError = "proxy fail";
  const sendProxyError = (wsWrapper: TestWsType, requestId: string) => {
    wsWrapper.sendMsg("proxyError", { requestId, message: proxyError });
  };

  it("proxyResult only works once per requestId", async () => {
    await checkOnlyOneMessagePerProxyResult(sendProxyResult, sendProxyResult);
  });

  it("proxyError only works once per requestId", async () => {
    await checkOnlyOneMessagePerProxyResult(sendProxyError, sendProxyError);
  });

  it("proxyError and proxyResult only work once per requestId", async () => {
    await checkOnlyOneMessagePerProxyResult(sendProxyError, sendProxyResult);
  });

  it("proxyResult and proxyError only work once per requestId", async () => {
    await checkOnlyOneMessagePerProxyResult(sendProxyResult, sendProxyError);
  });

  it("proxyError requires valid requestId", async () => {
    const wsWrapper = await getConnectedWs(authToken);
    return new Promise(async (resolve) => {
      wsWrapper.setHandler("invalidRequestId", async ({ requestId }) => {
        expect(requestId).toBe("foo");
        resolve(null);
      });
      wsWrapper.sendMsg("proxyError", {
        requestId: "foo",
        message: "",
      });
    });
  });

  it("proxyError works", async () => {
    const { routeKey, wsWrapper } = await initConnectedTest();
    wsWrapper.setHandler("proxy", async ({ requestId }) => {
      sendProxyError(wsWrapper, requestId);
    });
    const resp = await sendProxyRequest(routingSecret, routeKey);
    await checkRes(resp, 500, proxyError);
  });

  it("multiple routes work", async () => {
    const { authToken: authToken2 } = await client.call("createAuthToken");
    const routeKey1 = getRouteKey(authToken);
    const routeKey2 = getRouteKey(authToken2);
    const wsWrapper1 = await getConnectedWs(authToken);
    const wsWrapper2 = await getConnectedWs(authToken2);
    let resp2: Response;
    wsWrapper1.setHandler("proxy", async ({ requestId }) => {
      resp2 = await sendProxyRequest(routingSecret, routeKey2);
      sendProxyResult(wsWrapper1, requestId, "testBody1");
    });
    wsWrapper2.setHandler("proxy", async ({ requestId }) => {
      sendProxyResult(wsWrapper2, requestId, "testBody2");
    });
    const resp1 = await sendProxyRequest(routingSecret, routeKey1);
    await checkRes(resp1, 213, "testBody1");
    await checkRes(resp2!, 213, "testBody2");
  });
});
