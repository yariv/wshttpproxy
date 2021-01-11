const getHttpUrl = (port: number): string => {
  return `http://localhost:${port}`;
};

const configPorts = {
  exampleProdPort: 3000,
  exampleDevPort: 3001,
  localProxyPort: 3002,
  sidecarPort: 3003,
  wwwPort: 3004,
};

export const globalConfig = {
  ...configPorts,
  exampleUrl: getHttpUrl(configPorts.exampleProdPort),
  localProxyUrl: getHttpUrl(configPorts.localProxyPort),
  wwwUrl: getHttpUrl(configPorts.wwwPort),
  wwwWsUrl: `ws://localhost:${configPorts.wwwPort}/ws`,
  sidecarUrl: getHttpUrl(configPorts.sidecarPort),
};
