/*
  Warnings:

  - Added the required column `action` to the `request_logs` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "request_logs" ADD COLUMN     "action" TEXT NOT NULL;
