import { createHash } from "crypto";
import util from "util";

const charSet =
  "9876543210ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

export const genNewToken = (): string => {
  let res = "";
  for (let i = 0; i < 40; i++) {
    res += charSet[Math.floor(Math.random() * charSet.length)];
  }
  return res;
};

export const sha256 = (val: string): string => {
  return createHash("sha256").update(val).digest("hex");
};

export const log = (obj: any) => {
  console.log(util.inspect(obj, { showHidden: false, depth: null }));
};
