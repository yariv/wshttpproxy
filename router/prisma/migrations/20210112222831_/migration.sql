-- AlterTable
ALTER TABLE "Route" ALTER COLUMN "updated_at" DROP DEFAULT;

-- CreateTable
CREATE TABLE "OAuthToken" (
    "tokenHash" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    PRIMARY KEY ("tokenHash")
);

-- CreateIndex
CREATE UNIQUE INDEX "OAuthToken.tokenHash_clientId_unique" ON "OAuthToken"("tokenHash", "clientId");

-- CreateIndex
CREATE INDEX "OAuthToken.userId_clientId_index" ON "OAuthToken"("userId", "clientId");

-- AddForeignKey
ALTER TABLE "OAuthToken" ADD FOREIGN KEY("userId")REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
