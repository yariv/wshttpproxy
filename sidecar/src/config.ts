import { globalConfig } from "../../shared/src/globalConfig";

export const config = {
  prodServiceUrl: `http://localhost:${globalConfig.exampleProdPort}`,
  devProxyUrl: `http://localhost:${globalConfig.wwwPort}`,
};
