-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('UNPAID', 'PARTIAL', 'PAID', 'CANCELLED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "CommissionStatus" AS ENUM ('PENDING', 'PARTIAL', 'RELEASED', 'CANCELLED');

-- CreateTable
CREATE TABLE "revenues" (
    "id" TEXT NOT NULL,
    "grossSaleAmount" DECIMAL(15,2) NOT NULL,
    "commissionRate" DECIMAL(5,2) NOT NULL,
    "commissionAmount" DECIMAL(15,2) NOT NULL,
    "paymentReceived" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'UNPAID',
    "commissionStatus" "CommissionStatus" NOT NULL DEFAULT 'PENDING',
    "saleDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "propertyId" TEXT NOT NULL,
    "leadId" TEXT,
    "brokerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "revenues_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "revenues_leadId_key" ON "revenues"("leadId");

-- CreateIndex
CREATE INDEX "revenues_propertyId_idx" ON "revenues"("propertyId");

-- CreateIndex
CREATE INDEX "revenues_brokerId_idx" ON "revenues"("brokerId");

-- CreateIndex
CREATE INDEX "revenues_paymentStatus_idx" ON "revenues"("paymentStatus");

-- CreateIndex
CREATE INDEX "revenues_commissionStatus_idx" ON "revenues"("commissionStatus");

-- CreateIndex
CREATE INDEX "revenues_saleDate_idx" ON "revenues"("saleDate");

-- AddForeignKey
ALTER TABLE "revenues" ADD CONSTRAINT "revenues_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "revenues" ADD CONSTRAINT "revenues_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "leads"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "revenues" ADD CONSTRAINT "revenues_brokerId_fkey" FOREIGN KEY ("brokerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
