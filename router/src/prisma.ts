import { Prisma, PrismaClient } from "@prisma/client";

const gb = global as any;
if (!gb.prisma) {
  gb.prisma = new PrismaClient({ log: ["query", "info", "error", "warn"] });
}
export const prisma: PrismaClient = gb.prisma;
