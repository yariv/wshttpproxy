import { PrismaClient } from "@prisma/client";

const gb = global as any;
if (!gb.prisma) {
  console.log("INIT PRISMA");
  gb.prisma = new PrismaClient();
}
export const prisma = gb.prisma;
