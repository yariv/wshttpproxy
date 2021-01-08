const getHttpUrl = (port: number): string => {
  return `http://localhost:${port}`;
};

const configPorts = {
  examplePort: 3000,
  localProxyPort: 3001,
  sidecarPort: 3002,
  wwwDevPort: 3003,
  wwwProdPort: 3004,
};

export const globalConfig = {
  ...configPorts,
  exampleUrl: getHttpUrl(configPorts.examplePort),
  localProxyUrl: getHttpUrl(configPorts.localProxyPort),
  wwwUrl: getHttpUrl(configPorts.wwwDevPort),
  wwwWsUrl: `ws://localhost:${configPorts.wwwDevPort}/ws`,
  sidecarUrl: getHttpUrl(configPorts.sidecarPort),
};
