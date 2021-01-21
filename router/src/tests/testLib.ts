import client from "next-auth/client";
import { prisma } from "../prisma";
import { config } from "dotenv";
import path from "path";

config({ path: path.resolve(process.cwd(), ".env_test") });

export const setupMockSession = async () => {
  const user = await prisma.user.create({ data: {} });
  const mockSession = {
    expires: "1",
    user: { email: "email", name: "name", image: "image", id: user.id },
  };
  (client.getSession as jest.Mock).mockReturnValue(mockSession);
};
