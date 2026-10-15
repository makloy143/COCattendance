-- CreateEnum
CREATE TYPE "IdStockItemType" AS ENUM ('ID_CARD_BOX', 'SLING_BUNDLE');

-- CreateEnum
CREATE TYPE "IdReleaseStatus" AS ENUM ('NEW_ID', 'REPRINT');

-- CreateEnum
CREATE TYPE "IdBadPrintStatus" AS ENUM ('REPRINT', 'RESOLVED', 'CANCELLED');

-- CreateTable
CREATE TABLE "IdMaintenanceSettings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "cardsPerBox" INTEGER NOT NULL DEFAULT 100,
    "slingsPerBundle" INTEGER NOT NULL DEFAULT 100,
    "lowIdCardThreshold" INTEGER NOT NULL DEFAULT 300,
    "lowSlingThreshold" INTEGER NOT NULL DEFAULT 100,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IdMaintenanceSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IdStockReceipt" (
    "id" TEXT NOT NULL,
    "itemType" "IdStockItemType" NOT NULL,
    "packsReceived" INTEGER NOT NULL,
    "unitsPerPack" INTEGER NOT NULL,
    "unitsAdded" INTEGER NOT NULL,
    "receivedFrom" TEXT NOT NULL DEFAULT 'Main COC',
    "dateReceived" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "recordedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IdStockReceipt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IdReleaseEntry" (
    "id" TEXT NOT NULL,
    "personName" TEXT NOT NULL,
    "course" TEXT NOT NULL,
    "idNumber" TEXT NOT NULL,
    "transactionDate" TIMESTAMP(3) NOT NULL,
    "status" "IdReleaseStatus" NOT NULL,
    "reason" TEXT NOT NULL,
    "printedBy" TEXT NOT NULL,
    "idCardsUsed" INTEGER NOT NULL DEFAULT 0,
    "slingsUsed" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "studentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IdReleaseEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IdBadPrintEntry" (
    "id" TEXT NOT NULL,
    "personName" TEXT NOT NULL,
    "course" TEXT NOT NULL,
    "idNumber" TEXT NOT NULL,
    "datePrinted" TIMESTAMP(3) NOT NULL,
    "status" "IdBadPrintStatus" NOT NULL DEFAULT 'REPRINT',
    "reason" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "notes" TEXT,
    "studentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IdBadPrintEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "IdStockReceipt_itemType_idx" ON "IdStockReceipt"("itemType");

-- CreateIndex
CREATE INDEX "IdStockReceipt_dateReceived_idx" ON "IdStockReceipt"("dateReceived");

-- CreateIndex
CREATE INDEX "IdReleaseEntry_transactionDate_idx" ON "IdReleaseEntry"("transactionDate");

-- CreateIndex
CREATE INDEX "IdReleaseEntry_status_idx" ON "IdReleaseEntry"("status");

-- CreateIndex
CREATE INDEX "IdReleaseEntry_studentId_idx" ON "IdReleaseEntry"("studentId");

-- CreateIndex
CREATE INDEX "IdBadPrintEntry_datePrinted_idx" ON "IdBadPrintEntry"("datePrinted");

-- CreateIndex
CREATE INDEX "IdBadPrintEntry_status_idx" ON "IdBadPrintEntry"("status");

-- CreateIndex
CREATE INDEX "IdBadPrintEntry_studentId_idx" ON "IdBadPrintEntry"("studentId");

-- AddForeignKey
ALTER TABLE "IdReleaseEntry" ADD CONSTRAINT "IdReleaseEntry_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IdBadPrintEntry" ADD CONSTRAINT "IdBadPrintEntry_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Seed default pack sizes
INSERT INTO "IdMaintenanceSettings" ("id", "cardsPerBox", "slingsPerBundle", "lowIdCardThreshold", "lowSlingThreshold", "updatedAt")
VALUES ('default', 100, 100, 300, 100, CURRENT_TIMESTAMP);
