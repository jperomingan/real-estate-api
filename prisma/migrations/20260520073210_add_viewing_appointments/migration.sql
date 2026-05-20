-- CreateEnum
CREATE TYPE "ViewingStatus" AS ENUM ('REQUESTED', 'CONFIRMED', 'RESCHEDULED', 'COMPLETED', 'CANCELLED', 'DECLINED');

-- CreateTable
CREATE TABLE "viewing_appointments" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT,
    "email" TEXT,
    "phone" TEXT NOT NULL,
    "message" TEXT,
    "preferredDate" TIMESTAMP(3) NOT NULL,
    "confirmedDate" TIMESTAMP(3),
    "status" "ViewingStatus" NOT NULL DEFAULT 'REQUESTED',
    "notes" TEXT,
    "propertyId" TEXT NOT NULL,
    "brokerId" TEXT NOT NULL,
    "clientId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "viewing_appointments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "viewing_appointments_propertyId_idx" ON "viewing_appointments"("propertyId");

-- CreateIndex
CREATE INDEX "viewing_appointments_brokerId_idx" ON "viewing_appointments"("brokerId");

-- CreateIndex
CREATE INDEX "viewing_appointments_clientId_idx" ON "viewing_appointments"("clientId");

-- CreateIndex
CREATE INDEX "viewing_appointments_status_idx" ON "viewing_appointments"("status");

-- CreateIndex
CREATE INDEX "viewing_appointments_preferredDate_idx" ON "viewing_appointments"("preferredDate");

-- AddForeignKey
ALTER TABLE "viewing_appointments" ADD CONSTRAINT "viewing_appointments_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "viewing_appointments" ADD CONSTRAINT "viewing_appointments_brokerId_fkey" FOREIGN KEY ("brokerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "viewing_appointments" ADD CONSTRAINT "viewing_appointments_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
