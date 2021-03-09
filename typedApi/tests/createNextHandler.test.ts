import { createNextHandler } from "../src/nextAdapter";
import { ApiHttpError } from "../src/types";
import { testSchema } from "./testSchema";

describe("createNextHandler", () => {
  it("divide works", (async) => {
    const handler = createNextHandler(
      testSchema,
      "divide",
      async ({ num1, num2 }) => {
        if (num2 === 0) {
          throw new ApiHttpError("Can't divide by 0", 400);
        }
        return num1 / num2;
      }
    );
  });

  createNextHandler(testSchema, "sayHi", async ({ name }) => {
    return "Hi " + name;
  });
});
