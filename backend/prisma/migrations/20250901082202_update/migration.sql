-- CreateTable
CREATE TABLE "formDisburse" (
    "id" SERIAL NOT NULL,
    "to" VARCHAR(100),
    "from" VARCHAR(100),
    "Date" DATE NOT NULL,
    "subject" VARCHAR(100),
    "description" VARCHAR(200),
    "note" VARCHAR(200),
    "total_amount" DECIMAL(12,2),

    CONSTRAINT "formDisburse_pkey" PRIMARY KEY ("id")
);
