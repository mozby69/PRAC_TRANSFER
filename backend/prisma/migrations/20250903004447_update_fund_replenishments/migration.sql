-- CreateTable
CREATE TABLE "CountSheet" (
    "id" SERIAL NOT NULL,
    "fund_type" TEXT NOT NULL,
    "main_form_id" INTEGER,
    "office_name" TEXT NOT NULL,
    "date_count" TIMESTAMP(3) NOT NULL,
    "fund_name" TEXT NOT NULL,
    "fundAmount" DECIMAL(10,2) NOT NULL,
    "reference" TEXT,
    "cashDemo" JSONB,
    "repFund" DECIMAL(10,2) NOT NULL,
    "totalFund" DECIMAL(10,2) NOT NULL,
    "cashShort" DECIMAL(10,2),

    CONSTRAINT "CountSheet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CashFund" (
    "id" SERIAL NOT NULL,
    "count_sheet_id" INTEGER,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "req_date" TIMESTAMP(3) NOT NULL,
    "payee_name" TEXT NOT NULL,
    "remarks" TEXT,
    "fundAmount" DECIMAL(10,2) NOT NULL,
    "miscExp" DECIMAL(10,2),
    "billFee" DECIMAL(10,2),
    "telFee" DECIMAL(10,2),
    "dueMh" DECIMAL(10,2),

    CONSTRAINT "CashFund_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TravelFund" (
    "id" SERIAL NOT NULL,
    "count_sheet_id" INTEGER,
    "tagsField" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "req_date" TIMESTAMP(3) NOT NULL,
    "travelling" VARCHAR(255),
    "fuel" DECIMAL(10,2),
    "repair" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "litigation" DECIMAL(10,2),
    "totalFee" DECIMAL(10,2) NOT NULL,
    "km_value" TEXT,
    "remarks" TEXT,

    CONSTRAINT "TravelFund_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CountSheet_main_form_id_key" ON "CountSheet"("main_form_id");

-- CreateIndex
CREATE INDEX "CountSheet_main_form_id_idx" ON "CountSheet"("main_form_id");

-- CreateIndex
CREATE INDEX "CashFund_count_sheet_id_idx" ON "CashFund"("count_sheet_id");

-- CreateIndex
CREATE INDEX "TravelFund_count_sheet_id_idx" ON "TravelFund"("count_sheet_id");

-- AddForeignKey
ALTER TABLE "CountSheet" ADD CONSTRAINT "CountSheet_main_form_id_fkey" FOREIGN KEY ("main_form_id") REFERENCES "main_request"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CashFund" ADD CONSTRAINT "CashFund_count_sheet_id_fkey" FOREIGN KEY ("count_sheet_id") REFERENCES "CountSheet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TravelFund" ADD CONSTRAINT "TravelFund_count_sheet_id_fkey" FOREIGN KEY ("count_sheet_id") REFERENCES "CountSheet"("id") ON DELETE CASCADE ON UPDATE CASCADE;
