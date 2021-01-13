/*
  Warnings:

  - The migration will add a unique constraint covering the columns `[userId,clientId]` on the table `OAuthToken`. If there are existing duplicate values, the migration will fail.

*/
-- DropIndex
DROP INDEX "OAuthToken.userId_clientId_index";

-- CreateIndex
CREATE UNIQUE INDEX "OAuthToken.userId_clientId_unique" ON "OAuthToken"("userId", "clientId");
