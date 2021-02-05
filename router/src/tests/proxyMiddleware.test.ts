import { createTestOAuthToken, setupTest } from "dev-in-prod-lib/src/testLib";
import { WsWrapper } from "dev-in-prod-lib/src/typedWs";
import { getRouterApiUrl, globalConfig } from "dev-in-prod-lib/src/utils";
import { clientSchema, serverSchema } from "dev-in-prod-lib/src/wsSchema";
import { routerMain } from "../../routerMain";
import { routerApiSchema } from "../routerApiSchema";
import { TypedHttpClient } from "../typedApi/httpApi";
import WebSocket from "ws";

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
    const { routeKey } = await client.post("createRoute", {
      oauthToken,
      applicationSecret,
    });
    const originalHost = `${globalConfig.routeKeySubdomainPrefix}${routeKey}.localhost.localhost`;
    const res = await fetch(globalConfig.routerUrl, {
      headers: {
        [globalConfig.appSecretHeader]: applicationSecret,
        [globalConfig.originalHostHeader]: originalHost,
      },
    });
    checkRes(res, 400, "Route isn't connected");

    const res2 = await fetch(globalConfig.routerUrl, {
      headers: {
        [globalConfig.appSecretHeader]: applicationSecret,
        [globalConfig.originalHostHeader]: "http://localhost",
        [globalConfig.routeKeyHeader]: routeKey,
      },
    });
    checkRes(res2, 400, "Route isn't connected");
  });

  it("Forwards proxy request", async () => {
    const applicationSecret = await getAppSecret();
    const { routeKey } = await client.post("createRoute", {
      oauthToken,
      applicationSecret,
    });
    const ws = new WebSocket(globalConfig.routerWsUrl);
    const wsWrapper = new WsWrapper(ws, serverSchema, clientSchema);

    const bodyStr = "a=1";
    const testPath = "/testPath";
    return new Promise((resolve) => {
      wsWrapper.setHandler(
        "proxy",
        async ({ body, path, requestId, headers }) => {
          expect(body).toStrictEqual(bodyStr);
          expect(path).toStrictEqual(testPath);
          expect(headers[globalConfig.originalHostHeader]).toStrictEqual(
            "http://localhost"
          );
          expect(headers["host"]).toStrictEqual("http://localhost");
          console.log("sadf");
          resolve(null);
        }
      );
      wsWrapper.setHandler("connected", async () => {
        const res2 = await fetch(globalConfig.routerUrl + testPath, {
          headers: {
            [globalConfig.appSecretHeader]: applicationSecret,
            [globalConfig.originalHostHeader]: "http://localhost",
            [globalConfig.routeKeyHeader]: routeKey,
          },
          method: "POST",
          body: bodyStr,
        });
        console.log(res2.status);
      });
      ws.on("open", () => {
        wsWrapper.sendMsg("connect", {
          routeKey,
          applicationSecret,
          oauthToken,
        });
      });
    });
  });
});
