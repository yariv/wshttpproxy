const getHttpUrl = (port: number): string => {
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
  routerWsUrl: `ws://localhost:${configPorts.routerPort}/ws`,
  sidecarUrl: getHttpUrl(configPorts.sidecarPort),
  devInProdHeader: "dev-in-prod-enabled",
  sidecarProxyHeader: "dev-in-prod-sidecar",
};

export const getApiUrl = (baseUrl: string): string => {
  // TODO revise
  return baseUrl + "/api2/";
};
