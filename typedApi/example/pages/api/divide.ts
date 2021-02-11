import { createNextHandler } from "../../../src/nextAdapter";
import { ApiHttpError } from "../../../src/types";
import { schema } from "../../schema";

export default createNextHandler(schema, "divide", async ({ num1, num2 }) => {
  if (num2 === 0) {
    throw new ApiHttpError("Can't divide by 0", 400);
  }
  return num1 / num2;
});
