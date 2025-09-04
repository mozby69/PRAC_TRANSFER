-- CreateEnum
CREATE TYPE "Role" AS ENUM ('Admin', 'User', 'Branch', 'Coordinator', 'Superadmin');

-- CreateEnum
CREATE TYPE "Statuses" AS ENUM ('PENDING', 'INPROGRESS', 'CANCEL', 'APPROVED', 'REJECTED', 'EMPTY');

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'User',
    "branch_id" INTEGER,
    "signatureUrl" TEXT,
    "position" TEXT,
    "initial" TEXT,
    "approver" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "update_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "branches" (
    "id" SERIAL NOT NULL,
    "branchCode" TEXT NOT NULL,
    "branchName" TEXT NOT NULL,
    "bom" TEXT NOT NULL,
    "faa" TEXT NOT NULL,
    "telephone" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "update_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "branches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "request_types" (
    "id" SERIAL NOT NULL,
    "requestName" TEXT NOT NULL,
    "notedById" INTEGER,
    "checkedById" INTEGER,
    "checkedBy2Id" INTEGER,
    "recomApprovalId" INTEGER,
    "recomApproval2Id" INTEGER,
    "approveById" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updateAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "request_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "main_request" (
    "id" SERIAL NOT NULL,
    "request_type_id" INTEGER,
    "request_by_id" INTEGER,
    "requestFrom" INTEGER,
    "status" "Statuses" NOT NULL DEFAULT 'PENDING',
    "request_date" TIMESTAMP(3) NOT NULL,
    "remarks" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "update_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "main_request_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "form_fund_transfer" (
    "id" SERIAL NOT NULL,
    "main_reqeust_id" INTEGER,
    "request_to_id" INTEGER,
    "request_content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "update_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "form_fund_transfer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "approval_table" (
    "id" SERIAL NOT NULL,
    "main_form_id" INTEGER,
    "noted_by" "Statuses" NOT NULL DEFAULT 'PENDING',
    "checked_by" "Statuses" NOT NULL DEFAULT 'PENDING',
    "checked_by2" "Statuses" NOT NULL DEFAULT 'PENDING',
    "recom_approval" "Statuses" NOT NULL DEFAULT 'PENDING',
    "recom_approval2" "Statuses" NOT NULL DEFAULT 'PENDING',
    "approve_by" "Statuses" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "update_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "approval_table_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "request_logs" (
    "id" SERIAL NOT NULL,
    "approval_id" INTEGER,
    "checker_type" TEXT NOT NULL,
    "approver_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "request_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE INDEX "users_branch_id_idx" ON "users"("branch_id");

-- CreateIndex
CREATE UNIQUE INDEX "branches_branchCode_key" ON "branches"("branchCode");

-- CreateIndex
CREATE UNIQUE INDEX "request_types_requestName_key" ON "request_types"("requestName");

-- CreateIndex
CREATE INDEX "request_types_notedById_idx" ON "request_types"("notedById");

-- CreateIndex
CREATE INDEX "request_types_checkedById_idx" ON "request_types"("checkedById");

-- CreateIndex
CREATE INDEX "request_types_checkedBy2Id_idx" ON "request_types"("checkedBy2Id");

-- CreateIndex
CREATE INDEX "request_types_recomApprovalId_idx" ON "request_types"("recomApprovalId");

-- CreateIndex
CREATE INDEX "request_types_recomApproval2Id_idx" ON "request_types"("recomApproval2Id");

-- CreateIndex
CREATE INDEX "request_types_approveById_idx" ON "request_types"("approveById");

-- CreateIndex
CREATE INDEX "main_request_request_type_id_idx" ON "main_request"("request_type_id");

-- CreateIndex
CREATE INDEX "main_request_request_by_id_idx" ON "main_request"("request_by_id");

-- CreateIndex
CREATE INDEX "main_request_requestFrom_idx" ON "main_request"("requestFrom");

-- CreateIndex
CREATE UNIQUE INDEX "form_fund_transfer_main_reqeust_id_key" ON "form_fund_transfer"("main_reqeust_id");

-- CreateIndex
CREATE INDEX "form_fund_transfer_main_reqeust_id_idx" ON "form_fund_transfer"("main_reqeust_id");

-- CreateIndex
CREATE INDEX "form_fund_transfer_request_to_id_idx" ON "form_fund_transfer"("request_to_id");

-- CreateIndex
CREATE UNIQUE INDEX "approval_table_main_form_id_key" ON "approval_table"("main_form_id");

-- CreateIndex
CREATE INDEX "approval_table_main_form_id_idx" ON "approval_table"("main_form_id");

-- CreateIndex
CREATE INDEX "request_logs_approval_id_idx" ON "request_logs"("approval_id");

-- CreateIndex
CREATE INDEX "request_logs_approver_id_idx" ON "request_logs"("approver_id");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "request_types" ADD CONSTRAINT "request_types_notedById_fkey" FOREIGN KEY ("notedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "request_types" ADD CONSTRAINT "request_types_checkedById_fkey" FOREIGN KEY ("checkedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "request_types" ADD CONSTRAINT "request_types_checkedBy2Id_fkey" FOREIGN KEY ("checkedBy2Id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "request_types" ADD CONSTRAINT "request_types_recomApprovalId_fkey" FOREIGN KEY ("recomApprovalId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "request_types" ADD CONSTRAINT "request_types_recomApproval2Id_fkey" FOREIGN KEY ("recomApproval2Id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "request_types" ADD CONSTRAINT "request_types_approveById_fkey" FOREIGN KEY ("approveById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "main_request" ADD CONSTRAINT "main_request_request_type_id_fkey" FOREIGN KEY ("request_type_id") REFERENCES "request_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "main_request" ADD CONSTRAINT "main_request_request_by_id_fkey" FOREIGN KEY ("request_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "main_request" ADD CONSTRAINT "main_request_requestFrom_fkey" FOREIGN KEY ("requestFrom") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "form_fund_transfer" ADD CONSTRAINT "form_fund_transfer_main_reqeust_id_fkey" FOREIGN KEY ("main_reqeust_id") REFERENCES "main_request"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "form_fund_transfer" ADD CONSTRAINT "form_fund_transfer_request_to_id_fkey" FOREIGN KEY ("request_to_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approval_table" ADD CONSTRAINT "approval_table_main_form_id_fkey" FOREIGN KEY ("main_form_id") REFERENCES "main_request"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "request_logs" ADD CONSTRAINT "request_logs_approval_id_fkey" FOREIGN KEY ("approval_id") REFERENCES "approval_table"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "request_logs" ADD CONSTRAINT "request_logs_approver_id_fkey" FOREIGN KEY ("approver_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
