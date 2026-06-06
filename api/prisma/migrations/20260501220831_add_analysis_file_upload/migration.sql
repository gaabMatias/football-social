/*
  Warnings:

  - You are about to drop the column `body` on the `analyses` table. All the data in the column will be lost.
  - You are about to drop the column `dashboard_url` on the `analyses` table. All the data in the column will be lost.
  - You are about to drop the column `summary_json` on the `analyses` table. All the data in the column will be lost.
  - Added the required column `description` to the `analyses` table without a default value. This is not possible if the table is not empty.
  - Added the required column `file_key` to the `analyses` table without a default value. This is not possible if the table is not empty.
  - Added the required column `file_kind` to the `analyses` table without a default value. This is not possible if the table is not empty.
  - Added the required column `file_size` to the `analyses` table without a default value. This is not possible if the table is not empty.
  - Added the required column `original_filename` to the `analyses` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "FileKind" AS ENUM ('XLSX', 'PDF');

-- AlterTable
ALTER TABLE "analyses" DROP COLUMN "body",
DROP COLUMN "dashboard_url",
DROP COLUMN "summary_json",
ADD COLUMN     "deleted_at" TIMESTAMP(3),
ADD COLUMN     "description" TEXT NOT NULL,
ADD COLUMN     "file_key" TEXT NOT NULL,
ADD COLUMN     "file_kind" "FileKind" NOT NULL,
ADD COLUMN     "file_size" INTEGER NOT NULL,
ADD COLUMN     "original_filename" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "analyses_deleted_at_created_at_idx" ON "analyses"("deleted_at", "created_at");
