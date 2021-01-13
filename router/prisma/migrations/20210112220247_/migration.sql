/*
  Warnings:

  - The migration will add a unique constraint covering the columns `[ownerId,name]` on the table `Application`. If there are existing duplicate values, the migration will fail.

*/
-- DropIndex
DROP INDEX "Application.name_index";

-- CreateIndex
CREATE UNIQUE INDEX "Application.ownerId_name_unique" ON "Application"("ownerId", "name");
