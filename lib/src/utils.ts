export const getHttpUrl = (port: number): string => {
  return `http://localhost:${port}`;
};

const configPorts = {
  // routerPort: 3001, // note: should match google app settings
  // exampleProdPort: 3002,
  // exampleDevPort: 3003,
  // reverseProxyPort: 3005,
  // routerDbProxyPort: 3006,
};

export const config = {
  ...configPorts,
  routeKeyHeader: "ws-http-proxy-route-key",
  routingSecretHeader: "ws-http-proxy-routing-secret",
  routeKeyRegex: /^.+-(.+)$/,
  apiPathPrefix: "/api/",
  originalHostHeader: "x-forwarded-host",
  proxyTimeout: 10000,
};

export const getRouteKeyFromHostname = (
  hostname: string | string[]
): string | null => {
  const hostnames = Array.isArray(hostname) ? hostname : [hostname];
  for (const hostname of hostnames) {
    const toks = hostname.split(".");
    if (toks.length < 3) {
      return null;
    }
    const lastSubdomain = toks[toks.length - 3];
    const reRes = config.routeKeyRegex.exec(lastSubdomain);
    if (reRes) {
      return reRes[1];
    }
  }
  return null;
};

export const getRouteKeyFromCtx = (
  ctx: {
    headers: Record<string, string | string[] | undefined>;
    hostname: string;
  },
  hostnameHeader?: string | string[]
): string | undefined => {
  const res =
    (ctx.headers[config.routeKeyHeader] as string) ||
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
