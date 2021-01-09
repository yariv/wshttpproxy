import { start } from "./src/server";
import { globalConfig } from "../shared/src/globalConfig";
import { Closeable } from "../shared/src/appServer";

export const main = (port: number): Promise<Closeable> => {
  return start(port, __dirname);
};

if (require.main == module) {
  main(globalConfig.wwwPort);
}
