export const getHttpUrl = (port: number): string => {
  return `http://localhost:${port}`;
};

const configPorts = {
  routerPort: 3000, // note: should match google app settings
  exampleProdPort: 3001,
  exampleDevPort: 3002,
  localProxyPort: 3003,
  sidecarPort: 3004,
};

export const globalConfig = {
  ...configPorts,
  exampleProdUrl: getHttpUrl(configPorts.exampleProdPort),
  exampleDevUrl: getHttpUrl(configPorts.exampleDevPort),
  localProxyUrl: getHttpUrl(configPorts.localProxyPort),
  routerUrl: getHttpUrl(configPorts.routerPort),
  sidecarUrl: getHttpUrl(configPorts.sidecarPort),
  routeKeyHeader: "dev-in-prod-route-key",
  appSecretHeader: "dev-in-prod-app-secret",
  routeKeySubdomainPrefix: "rk-",
  apiPathPrefix: "/api/",
  originalHostHeader: "x-forwarded-host",
  proxyTimeout: 10000,
};

export const getRouterWsUrl = (serverPort: number): string =>
  `ws://localhost:${serverPort}/ws`;

export const getApiUrl = (serverPort: number): string => {
  // TODO revise
  return getHttpUrl(serverPort) + globalConfig.apiPathPrefix;
};

// TODO move to a different file?
export const getRouteKeyFromHostname = (hostname: string): string | null => {
  const toks = hostname.split(".");
  if (toks.length < 3) {
    return null;
  }
  const lastSubdomain = toks[toks.length - 3];
  if (!lastSubdomain.startsWith(globalConfig.routeKeySubdomainPrefix)) {
    return null;
  }
  return lastSubdomain.substring(globalConfig.routeKeySubdomainPrefix.length);
};

export const getRouteKeyFromCtx = (
  ctx: {
    headers: Record<string, string | null>;
    hostname: string;
  },
  hostnameHeader?: string
): string | null => {
  return (
    ctx.headers[globalConfig.routeKeyHeader] ||
    getRouteKeyFromHostname(hostnameHeader || ctx.hostname)
  );
};

const charSet =
  "9876543210ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

export const genNewToken = (): string => {
  let res = "";
  for (let i = 0; i < 40; i++) {
    res += charSet[Math.floor(Math.random() * charSet.length)];
  }
  return res;
};
