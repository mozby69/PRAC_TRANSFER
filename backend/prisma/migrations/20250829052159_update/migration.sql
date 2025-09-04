-- CreateTable
CREATE TABLE "form_proposed_budget" (
    "id" SERIAL NOT NULL,
    "description" VARCHAR(200),
    "budget" DECIMAL(10,2),
    "total_expenses" DECIMAL(10,2),
    "variance" DECIMAL(10,2),
    "proposed_budget" DECIMAL(10,2),
    "remarks" VARCHAR(200),
    "expense_type" VARCHAR(50),
    "month_of" VARCHAR(50),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "main_form_id" INTEGER NOT NULL,

    CONSTRAINT "form_proposed_budget_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "form_proposed_budget_main_form_id_key" ON "form_proposed_budget"("main_form_id");

-- CreateIndex
CREATE INDEX "form_proposed_budget_main_form_id_idx" ON "form_proposed_budget"("main_form_id");

-- AddForeignKey
ALTER TABLE "form_proposed_budget" ADD CONSTRAINT "form_proposed_budget_main_form_id_fkey" FOREIGN KEY ("main_form_id") REFERENCES "main_request"("id") ON DELETE CASCADE ON UPDATE CASCADE;
