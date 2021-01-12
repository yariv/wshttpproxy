/*
  Warnings:

  - The migration will change the primary key for the `accounts` table. If it partially fails, the table could be left without primary key constraint.
  - The migration will change the primary key for the `sessions` table. If it partially fails, the table could be left without primary key constraint.
  - The migration will change the primary key for the `users` table. If it partially fails, the table could be left without primary key constraint.
  - The migration will change the primary key for the `verification_requests` table. If it partially fails, the table could be left without primary key constraint.

*/
-- AlterTable
ALTER TABLE "accounts" DROP CONSTRAINT "accounts_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "user_id" SET DATA TYPE TEXT,
ADD PRIMARY KEY ("id");
DROP SEQUENCE "accounts_id_seq";

-- AlterTable
ALTER TABLE "sessions" DROP CONSTRAINT "sessions_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "user_id" SET DATA TYPE TEXT,
ADD PRIMARY KEY ("id");
DROP SEQUENCE "sessions_id_seq";

-- AlterTable
ALTER TABLE "users" DROP CONSTRAINT "users_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD PRIMARY KEY ("id");
DROP SEQUENCE "users_id_seq";

-- AlterTable
ALTER TABLE "verification_requests" DROP CONSTRAINT "verification_requests_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD PRIMARY KEY ("id");
DROP SEQUENCE "verification_requests_id_seq";

-- CreateTable
CREATE TABLE "Application" (
    "id" TEXT NOT NULL,
    "secret" TEXT NOT NULL,

    PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Application.secret_unique" ON "Application"("secret");
