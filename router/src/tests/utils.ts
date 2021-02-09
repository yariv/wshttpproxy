import { routerApiSchema } from "dev-in-prod-lib/src/routerApiSchema";
import { getApiUrl, globalConfig } from "dev-in-prod-lib/src/utils";
import { TypedHttpClient } from "typed-api/src/httpApi";
import { routerMain } from "../../routerMain";

export const setupRouterTest = async (
  defer: (func: () => Promise<void>) => void
): Promise<TypedHttpClient<typeof routerApiSchema>> => {
  let client: TypedHttpClient<typeof routerApiSchema>;

  const { serverPort, close: closeFunc } = await routerMain(0);
  client = new TypedHttpClient(getApiUrl(serverPort), routerApiSchema);
  defer(closeFunc);

  return client;
};
