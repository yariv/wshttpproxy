import { ApiHttpError, createHandler } from "../../server";
import { schema } from "../../schema";

export default createHandler(schema, "divide", async (req) => {
  if (req.parsedBody.num2 === 0) {
    throw new ApiHttpError({ message: "Can't divide by 0", status: 400 });
  }
  return {
    result: req.parsedBody.num1 / req.parsedBody.num2,
  };
});
