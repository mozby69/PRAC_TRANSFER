/*
  Warnings:

  - You are about to drop the column `Date` on the `form_disburse` table. All the data in the column will be lost.
  - Added the required column `date` to the `form_disburse` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "form_disburse" DROP COLUMN "Date",
ADD COLUMN     "date" DATE NOT NULL,
ADD COLUMN     "items" JSONB;
