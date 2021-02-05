import { log } from "dev-in-prod-lib/src/log";

const foo = () => {
  beforeAll(() => {
    log("x");
  });

  beforeAll(() => {
    log("y");
  });
};

describe("proxy middleware", () => {
  foo();

  it("works", () => {
    console.log("x");
  });
});
