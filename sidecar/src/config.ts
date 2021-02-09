import { globalConfig } from "dev-in-prod-lib/src/utils";

export const config = {
  prodServiceUrl: `http://localhost:${globalConfig.exampleProdPort}`,
  routerUrl: `http://localhost:${globalConfig.routerPort}`,
};
