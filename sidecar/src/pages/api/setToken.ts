import { NextApiRequest, NextApiResponse } from "next";
import storage from "node-persist";

const NextAuthPage = (req: NextApiRequest, res: NextApiResponse) => {
  const token = req.body.token;
  if (!token) {
    res.status(400).end("Missing token");
    return;
  }

  storage.set("token", token);

  res.status(200).end();
};
export default NextAuthPage;
