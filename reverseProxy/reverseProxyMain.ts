import { startReverseProxy } from "./src/reverseProxy";
import { parse } from "ts-command-line-args";

interface ReverseProxyArguments {
  port: number;
  routingSecret: string;
  prodUrl: string;
  wsServerUrl: string;
}

if (require.main == module) {
  const args = parse<ReverseProxyArguments>({
    port: Number,
    routingSecret: String,
    prodUrl: String,
    wsServerUrl: String,
  });
  startReverseProxy(
    args.port,
    args.routingSecret,
    args.prodUrl,
    args.wsServerUrl
  );
}
export {};
