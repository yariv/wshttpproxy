const getHttpUrl = (port: number): string => {
  return `http://localhost:${port}`;
};

const configPorts = {
  examplePort: 3000,
  localProxyPort: 3001,
  wwwPort: 3002,
  sidecarPort: 3003,
};

export const globalConfig = {
  ...configPorts,
  exampleUrl: getHttpUrl(configPorts.examplePort),
  localProxyUrl: getHttpUrl(configPorts.localProxyPort),
  wwwUrl: getHttpUrl(configPorts.wwwPort),
  wwwWsUrl: `ws://localhost:${configPorts.wwwPort}/ws`,
  sidecarUrl: getHttpUrl(configPorts.sidecarPort),
};
