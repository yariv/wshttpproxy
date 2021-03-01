import { AppServer } from "dev-in-prod-lib/src/appServer";
import { routerApiSchema } from "dev-in-prod-lib/src/routerApiSchema";
import { ConnectionOptions } from "mysql2";
import { TypedHttpClient } from "typed-api/src/httpApi";
import { routerMain } from "../../routerMain";
import portfinder from "portfinder";

export const connOptions: ConnectionOptions = {
  host: "127.0.0.1",
  port: 3306,
  user: "root",
  password: "root",
  database: "test",
};

export const setupRouterTest = async (
  defer: (func: () => Promise<void>) => void
): Promise<{
  client: TypedHttpClient<typeof routerApiSchema>;
  appServer: AppServer;
  dbProxyPort: number;
}> => {
  let client: TypedHttpClient<typeof routerApiSchema>;
  const dbProxyPort = await portfinder.getPortPromise();
  const appServer = await routerMain(0, dbProxyPort, connOptions);
  client = new TypedHttpClient(appServer.apiUrl, routerApiSchema);
  defer(appServer.close.bind(appServer));

  return { client, appServer, dbProxyPort };
};
