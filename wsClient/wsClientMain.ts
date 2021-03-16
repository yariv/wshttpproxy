import dotenv from "dotenv";
import { config } from "../lib/src/utils";
import { WsClient } from "./src/wsClient";
import { parse } from "ts-command-line-args";

interface ReverseProxyArguments {
  routerWsUrl: string;
  devServiceUrl: string;
  authToken: string;
}

export const wsClientMain = async (
  routerWsUrl: string,
  localServiceUrl: string,
  authToken: string
): Promise<WsClient> => {
  const wsClient = new WsClient(routerWsUrl, localServiceUrl, authToken);
  await wsClient.connectWs();
  return wsClient;
};

if (require.main == module) {
  const args = parse<ReverseProxyArguments>({
    routerWsUrl: String,
    devServiceUrl: String,
    authToken: String,
  });

  wsClientMain(args.routerWsUrl, args.devServiceUrl, args.authToken);
}
