/*
  Warnings:

  - You are about to drop the column `to` on the `form_disburse` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "form_disburse" DROP COLUMN "to",
ADD COLUMN     "to_id" INTEGER;

-- AddForeignKey
ALTER TABLE "form_disburse" ADD CONSTRAINT "form_disburse_to_id_fkey" FOREIGN KEY ("to_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
