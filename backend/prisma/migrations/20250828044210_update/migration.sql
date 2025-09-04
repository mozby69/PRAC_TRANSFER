-- CreateTable
CREATE TABLE "form_travel_order" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100),
    "position" VARCHAR(50),
    "departure_date" DATE NOT NULL,
    "current_date" DATE NOT NULL,
    "destination" VARCHAR(100),
    "purpose_of_travel" VARCHAR(100),
    "items" JSONB,
    "total_amount" DECIMAL(12,2),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "main_form_id" INTEGER NOT NULL,

    CONSTRAINT "form_travel_order_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "form_travel_order_main_form_id_idx" ON "form_travel_order"("main_form_id");

-- AddForeignKey
ALTER TABLE "form_travel_order" ADD CONSTRAINT "form_travel_order_main_form_id_fkey" FOREIGN KEY ("main_form_id") REFERENCES "main_request"("id") ON DELETE CASCADE ON UPDATE CASCADE;
