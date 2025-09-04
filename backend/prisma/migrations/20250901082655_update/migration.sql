/*
  Warnings:

  - A unique constraint covering the columns `[main_form_id]` on the table `form_disburse` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `main_form_id` to the `form_disburse` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "form_disburse" ADD COLUMN     "main_form_id" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "form_disburse_main_form_id_key" ON "form_disburse"("main_form_id");

-- AddForeignKey
ALTER TABLE "form_disburse" ADD CONSTRAINT "form_disburse_main_form_id_fkey" FOREIGN KEY ("main_form_id") REFERENCES "main_request"("id") ON DELETE CASCADE ON UPDATE CASCADE;
