/*
  Warnings:

  - You are about to drop the column `to` on the `form_transmittal_memo` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "form_transmittal_memo" DROP COLUMN "to",
ADD COLUMN     "to_id" INTEGER;

-- AddForeignKey
ALTER TABLE "form_transmittal_memo" ADD CONSTRAINT "form_transmittal_memo_to_id_fkey" FOREIGN KEY ("to_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
