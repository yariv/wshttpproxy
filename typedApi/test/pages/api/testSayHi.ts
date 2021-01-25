import { createHandler } from "../../../src/server";
import { schema } from "../../testSchema";

export default createHandler(schema, "testSayHi", async (req) => {
  const name = req.parsedBody.name;
  return {
    salute: "Hi " + name,
  };
});
