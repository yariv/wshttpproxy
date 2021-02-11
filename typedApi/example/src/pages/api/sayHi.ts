import { createNextHandler } from "../../../../src/nextAdapter";
import { schema } from "../../schema";

export default createNextHandler(schema, "sayHi", async ({ name }) => {
  return "Hi " + name;
});
