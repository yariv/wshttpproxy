import { createHandler } from "../../../src/server";
import { schema } from "../../testSchema";

export default createHandler(schema, "testMultiply", async (req) => {
  return {
    result: req.parsedBody.num1 * req.parsedBody.num2,
  };
});
