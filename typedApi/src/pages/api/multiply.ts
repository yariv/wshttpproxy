import { createHandler } from "../../../src/server";
import { schema } from "../../schema";

export default createHandler(schema, "multiply", async (req) => {
  return {
    result: req.parsedBody.num1 * req.parsedBody.num2,
  };
});
