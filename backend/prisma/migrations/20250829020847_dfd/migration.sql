/*
  Warnings:

  - A unique constraint covering the columns `[main_form_id]` on the table `form_travel_order` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "form_travel_order_main_form_id_key" ON "form_travel_order"("main_form_id");
