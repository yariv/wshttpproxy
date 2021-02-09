import { routerApiSchema } from "dev-in-prod-lib/src/routerApiSchema";
import { getRouterApiUrl, globalConfig } from "dev-in-prod-lib/src/utils";
import { TypedHttpClient } from "typed-api/src/httpApi";
import { routerMain } from "../../routerMain";

export const setupRouterTest = async (
  defer: (func: () => Promise<void>) => void
): Promise<TypedHttpClient<typeof routerApiSchema>> => {
  let client: TypedHttpClient<typeof routerApiSchema>;

  const { serverPort, closeFunc } = await routerMain(0);
  client = new TypedHttpClient(getRouterApiUrl(serverPort), routerApiSchema);
  defer(closeFunc);

  return client;
};
