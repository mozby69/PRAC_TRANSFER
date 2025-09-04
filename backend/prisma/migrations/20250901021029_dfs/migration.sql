/*
  Warnings:

  - You are about to drop the `formTransmittalMemo` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "formTransmittalMemo" DROP CONSTRAINT "formTransmittalMemo_main_form_id_fkey";

-- DropTable
DROP TABLE "formTransmittalMemo";

-- CreateTable
CREATE TABLE "form_transmittal_memo" (
    "id" SERIAL NOT NULL,
    "to" VARCHAR(100),
    "from" VARCHAR(100),
    "date" DATE NOT NULL,
    "description" VARCHAR(200),
    "note" VARCHAR(200),
    "items" JSONB,
    "main_form_id" INTEGER NOT NULL,

    CONSTRAINT "form_transmittal_memo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "form_transmittal_memo_main_form_id_key" ON "form_transmittal_memo"("main_form_id");

-- AddForeignKey
ALTER TABLE "form_transmittal_memo" ADD CONSTRAINT "form_transmittal_memo_main_form_id_fkey" FOREIGN KEY ("main_form_id") REFERENCES "main_request"("id") ON DELETE CASCADE ON UPDATE CASCADE;
