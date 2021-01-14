import { PrismaClient } from "@prisma/client";

console.log("INIT PRISMA");
export const prisma = new PrismaClient();
