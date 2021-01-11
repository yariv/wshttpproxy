const getHttpUrl = (port: number): string => {
  return `http://localhost:${port}`;
};

const configPorts = {
  exampleProdPort: 3000,
  exampleDevPort: 3001,
  localProxyPort: 3002,
  sidecarPort: 3003,
  routerPort: 3004,
};

export const globalConfig = {
  ...configPorts,
  exampleUrl: getHttpUrl(configPorts.exampleProdPort),
  localProxyUrl: getHttpUrl(configPorts.localProxyPort),
  routerUrl: getHttpUrl(configPorts.routerPort),
  routerWsUrl: `ws://localhost:${configPorts.routerPort}/ws`,
  sidecarUrl: getHttpUrl(configPorts.sidecarPort),
};
