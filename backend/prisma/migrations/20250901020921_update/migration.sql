-- CreateTable
CREATE TABLE "formTransmittalMemo" (
    "id" SERIAL NOT NULL,
    "to" VARCHAR(100),
    "from" VARCHAR(100),
    "date" DATE NOT NULL,
    "description" VARCHAR(200),
    "note" VARCHAR(200),
    "items" JSONB,
    "main_form_id" INTEGER NOT NULL,

    CONSTRAINT "formTransmittalMemo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "formTransmittalMemo_main_form_id_key" ON "formTransmittalMemo"("main_form_id");

-- AddForeignKey
ALTER TABLE "formTransmittalMemo" ADD CONSTRAINT "formTransmittalMemo_main_form_id_fkey" FOREIGN KEY ("main_form_id") REFERENCES "main_request"("id") ON DELETE CASCADE ON UPDATE CASCADE;
