import { AppServer } from "dev-in-prod-lib/src/appServer";
import { routerApiSchema } from "dev-in-prod-lib/src/routerApiSchema";
import { TypedHttpClient } from "typed-api/src/httpApi";
import { routerMain } from "../../routerMain";

export const setupRouterTest = async (
  defer: (func: () => Promise<void>) => void
): Promise<{
  client: TypedHttpClient<typeof routerApiSchema>;
  appServer: AppServer;
}> => {
  let client: TypedHttpClient<typeof routerApiSchema>;

  const appServer = await routerMain(0);
  client = new TypedHttpClient(appServer.apiUrl, routerApiSchema);
  defer(appServer.close.bind(appServer));

  return { client, appServer };
};
