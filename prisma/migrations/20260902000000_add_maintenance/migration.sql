-- CreateEnum
CREATE TYPE "AssetStatus" AS ENUM ('AVAILABLE', 'UNDER_MAINTENANCE', 'RETIRED', 'LOST', 'DAMAGED');

-- CreateEnum
CREATE TYPE "MaintenanceStatus" AS ENUM ('OPEN', 'DIAGNOSING', 'UNDER_REPAIR', 'AWAITING_PARTS', 'AWAITING_VENDOR', 'COMPLETED', 'UNREPAIRABLE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "MaintenancePriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "MaintenanceEventType" AS ENUM ('CREATED', 'STATUS_CHANGED', 'TECHNICIAN_ASSIGNED', 'DIAGNOSTIC_UPDATED', 'PARTS_UPDATED', 'REMARKS_UPDATED', 'REPAIR_COMPLETED', 'UPDATED');

-- AlterTable
ALTER TABLE "ReceivedItem" ADD COLUMN "assetStatus" "AssetStatus" NOT NULL DEFAULT 'AVAILABLE';

-- CreateTable
CREATE TABLE "MaintenanceRecord" (
    "id" TEXT NOT NULL,
    "maintenanceNumber" TEXT NOT NULL,
    "receivedItemId" TEXT,
    "itemName" TEXT NOT NULL,
    "equipmentType" TEXT NOT NULL,
    "assetNumber" TEXT NOT NULL,
    "serialNumber" TEXT,
    "problem" TEXT NOT NULL,
    "description" TEXT,
    "dateReported" TIMESTAMP(3) NOT NULL,
    "reportedBy" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "priority" "MaintenancePriority" NOT NULL DEFAULT 'MEDIUM',
    "status" "MaintenanceStatus" NOT NULL DEFAULT 'OPEN',
    "assignedTechnician" TEXT,
    "diagnosticFindings" TEXT,
    "actionTaken" TEXT,
    "partsReplaced" TEXT,
    "repairCost" DOUBLE PRECISION,
    "dateSentForRepair" TIMESTAMP(3),
    "dateCompleted" TIMESTAMP(3),
    "vendor" TEXT,
    "warranty" TEXT,
    "remarks" TEXT,
    "attachmentData" BYTEA,
    "attachmentMimeType" TEXT,
    "attachmentName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MaintenanceRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaintenanceEvent" (
    "id" TEXT NOT NULL,
    "maintenanceId" TEXT NOT NULL,
    "eventType" "MaintenanceEventType" NOT NULL,
    "message" TEXT NOT NULL,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MaintenanceEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MaintenanceRecord_maintenanceNumber_key" ON "MaintenanceRecord"("maintenanceNumber");

-- CreateIndex
CREATE INDEX "MaintenanceRecord_status_idx" ON "MaintenanceRecord"("status");

-- CreateIndex
CREATE INDEX "MaintenanceRecord_priority_idx" ON "MaintenanceRecord"("priority");

-- CreateIndex
CREATE INDEX "MaintenanceRecord_dateReported_idx" ON "MaintenanceRecord"("dateReported");

-- CreateIndex
CREATE INDEX "MaintenanceRecord_receivedItemId_idx" ON "MaintenanceRecord"("receivedItemId");

-- CreateIndex
CREATE INDEX "MaintenanceEvent_maintenanceId_createdAt_idx" ON "MaintenanceEvent"("maintenanceId", "createdAt");

-- AddForeignKey
ALTER TABLE "MaintenanceRecord" ADD CONSTRAINT "MaintenanceRecord_receivedItemId_fkey" FOREIGN KEY ("receivedItemId") REFERENCES "ReceivedItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceEvent" ADD CONSTRAINT "MaintenanceEvent_maintenanceId_fkey" FOREIGN KEY ("maintenanceId") REFERENCES "MaintenanceRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;
