import { createAuthdHandler } from "src/middleware";

export default createAuthdHandler("createRoute", async (req) => {
  const ownerId = (req.session.user as any).id;
  return { secret: "foo" };
});
