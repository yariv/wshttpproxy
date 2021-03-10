import { createNextHandler } from "../src/nextAdapter";
import { ApiHttpError } from "../src/types";
import { testSchema } from "./testSchema";

class MockResponse {
  _status: number | undefined;
  _json: any;

  status(val: number) {
    this._status = val;
  }

  json(val: any) {
    this._json = val;
  }
}

describe("createNextHandler", () => {
  const divideHandler = createNextHandler(
    testSchema,
    "divide",
    async ({ num1, num2 }) => {
      if (num2 === 0) {
        throw new ApiHttpError("Can't divide by 0", 400);
      }
      return num1 / num2;
    }
  );
  it("divide works", async () => {
    const resp = new MockResponse();
    await divideHandler({ body: { num1: 10, num2: 5 } } as any, resp as any);
    expect(resp._status).toStrictEqual(200);
    expect(resp._json).toStrictEqual(2);
  });
});
