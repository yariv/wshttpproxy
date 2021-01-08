import { Closeable, start } from "../shared/src/appServer";
import { globalConfig } from "../shared/src/globalConfig";

export const main = (port: number): Promise<Closeable> => {
  return start(port, __dirname);
};

if (require.main == module) {
  main(globalConfig.exampleProdPort);
}
