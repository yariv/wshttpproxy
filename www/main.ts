import { start } from "./src/server";
import { globalConfig } from "../shared/src/globalConfig";
import { Closeable } from "../shared/src/appServer";

export const main = (): Promise<Closeable> => {
  return start(globalConfig.wwwPort, __dirname);
};

if (require.main == module) {
  main();
}
