/*
  Warnings:

  - You are about to drop the `formDisburse` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "formDisburse";

-- CreateTable
CREATE TABLE "form_disburse" (
    "id" SERIAL NOT NULL,
    "to" VARCHAR(100),
    "from" VARCHAR(100),
    "Date" DATE NOT NULL,
    "subject" VARCHAR(100),
    "description" VARCHAR(200),
    "note" VARCHAR(200),
    "total_amount" DECIMAL(12,2),

    CONSTRAINT "form_disburse_pkey" PRIMARY KEY ("id")
);
