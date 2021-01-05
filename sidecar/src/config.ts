import { globalConfig } from "../../shared/src/globalConfig";

export const config = {
  prodServiceUrl: `http://localhost:${globalConfig.examplePort}`,
  devProxyUrl: `http://localhost:${globalConfig.wwwPort}`,
};
