export const getHttpUrl = (port: number): string => {
  return `http://localhost:${port}`;
};

const configPorts = {
  routerPort: 3001, // note: should match google app settings
  exampleProdPort: 3002,
  exampleDevPort: 3003,
  localProxyPort: 3004,
  sidecarPort: 3005,
  routerDbProxyPort: 3006,
  localProxyDbProxyPort: 3007,
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
  routeKeyRegex: /^.+-rk-(.+)$/,
  apiPathPrefix: "/api/",
  originalHostHeader: "x-forwarded-host",
  proxyTimeout: 10000,
  oauthAuthorizeUrl: "https://dsee.io/oauth2/authorize",
  oauthCallbackUrl: getHttpUrl(configPorts.localProxyPort) + "/oauth2/callback",
  defaultDbConnOptions: {
    host: "localhost",
    port: 3306,
    user: "root",
    password: "root",
    database: "devinproddemo",
  },
};

// TODO move to a different file?
export const getRouteKeyFromHostname = (hostname: string): string | null => {
  const toks = hostname.split(".");
  if (toks.length < 3) {
    return null;
  }
  const lastSubdomain = toks[toks.length - 3];
  const reRes = globalConfig.routeKeyRegex.exec(lastSubdomain);
  return reRes ? reRes[1] : null;
};

export const getRouteKeyFromCtx = (
  ctx: {
    headers: Record<string, string | null>;
    hostname: string;
  },
  hostnameHeader?: string
): string | undefined => {
  const res =
    ctx.headers[globalConfig.routeKeyHeader] ||
    getRouteKeyFromHostname(hostnameHeader || ctx.hostname);
  return res?.toLowerCase();
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
