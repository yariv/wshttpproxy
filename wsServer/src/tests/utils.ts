import { TypedHttpClient } from "infer-rpc/dist/httpClient";
import portfinder from "portfinder";
import { AppServer } from "../../../lib/src/appServer";
import { routerApiSchema } from "../../../lib/src/routerApiSchema";
import { genNewToken } from "../../../lib/src/utils";
import { routerMain } from "../../wsServerMain";

export const setupRouterTest = async (
  defer: (func: () => Promise<void>) => void
): Promise<{
  client: TypedHttpClient<typeof routerApiSchema>;
  appServer: AppServer;
  dbProxyPort: number;
  routingSecret: string;
}> => {
  let client: TypedHttpClient<typeof routerApiSchema>;
  const dbProxyPort = await portfinder.getPortPromise();
  const routingSecret = genNewToken();
  const appServer = await routerMain(0, routingSecret);
  client = new TypedHttpClient(appServer.apiUrl, routerApiSchema);
  defer(appServer.close.bind(appServer));

  return { client, appServer, dbProxyPort, routingSecret };
};
