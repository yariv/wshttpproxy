import { AppServer } from "../../../lib/src/appServer";
import { routerApiSchema } from "../../../lib/src/routerApiSchema";
import { ConnectionOptions } from "mysql2";
import { TypedHttpClient } from "infer-rpc/dist/httpClient";
import { routerMain } from "../../routerMain";
import portfinder from "portfinder";
import { genNewToken } from "../../../lib/src/utils";

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
  routingSecret: string;
}> => {
  let client: TypedHttpClient<typeof routerApiSchema>;
  const dbProxyPort = await portfinder.getPortPromise();
  const routingSecret = genNewToken();
  const appServer = await routerMain(
    0,
    routingSecret,
    dbProxyPort,
    connOptions
  );
  client = new TypedHttpClient(appServer.apiUrl, routerApiSchema);
  defer(appServer.close.bind(appServer));

  return { client, appServer, dbProxyPort, routingSecret };
};
