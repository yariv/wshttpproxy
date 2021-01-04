import { NextApiRequest, NextApiResponse } from "next";
import storage from "node-persist";
import { initWsClient } from "../../wsClient";

const NextAuthPage = (req: NextApiRequest, res: NextApiResponse) => {
  const token = req.body.token;
  if (!token) {
    res.status(400).end("Missing token");
    return;
  }

  (async () => {
    await storage.set("token", token);
    initWsClient(token);
  })();

  res.status(200).end();
};
export default NextAuthPage;
