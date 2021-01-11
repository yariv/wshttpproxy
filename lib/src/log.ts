import util from "util";

export const log = (...x: any[]) => {
  console.log(
    util.inspect(x, { showHidden: false, depth: null, colors: true })
  );
};
