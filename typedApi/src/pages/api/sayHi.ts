import { createHandler } from "../../../src/server";
import { schema } from "../../schema";

export default createHandler(schema, "sayHi", async (req) => {
  const name = req.parsedBody.name;
  return {
    salute: "Hi " + name,
  };
});
