import { createHash } from "crypto";
import util from "util";

export const sha256 = (val: string): string => {
  return createHash("sha256").update(val).digest("hex");
};

export const log = (obj: any) => {
  console.log(util.inspect(obj, { showHidden: false, depth: null }));
};
