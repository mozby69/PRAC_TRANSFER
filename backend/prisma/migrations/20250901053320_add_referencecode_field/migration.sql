/*
  Warnings:

  - A unique constraint covering the columns `[reference_code]` on the table `main_request` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `reference_code` to the `main_request` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "main_request" ADD COLUMN     "reference_code" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "main_request_reference_code_key" ON "main_request"("reference_code");
