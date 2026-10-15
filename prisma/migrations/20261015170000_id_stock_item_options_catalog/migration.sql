-- CreateEnum
CREATE TYPE "IdStockCategory" AS ENUM ('ID_CARD', 'SLING_STUDENT', 'SLING_EMPLOYEE', 'SUPPLY');

-- CreateTable
CREATE TABLE "IdStockItemOption" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "IdStockCategory" NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IdStockItemOption_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "IdStockItemOption_active_sortOrder_idx" ON "IdStockItemOption"("active", "sortOrder");

-- Seed the item types already used on the receive form.
INSERT INTO "IdStockItemOption" ("id", "name", "category", "sortOrder", "active", "createdAt", "updatedAt") VALUES
('id-card', 'PLAIN WHITE PVC CARD', 'ID_CARD', 0, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('sling-student', 'Sling for Student', 'SLING_STUDENT', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('sling-employee', 'Sling for Employee', 'SLING_EMPLOYEE', 2, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('xid-color', 'XID PRINTER (COLOR) Y,M,C,K', 'SUPPLY', 3, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('xid-film', 'XID PRINTER RETRANSFER FILM', 'SUPPLY', 4, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- AlterTable
ALTER TABLE "IdStockReceipt" ADD COLUMN "itemOptionId" TEXT;

UPDATE "IdStockReceipt" SET "itemOptionId" = 'id-card' WHERE "itemType" IN ('ID_CARD', 'ID_CARD_BOX');
UPDATE "IdStockReceipt" SET "itemOptionId" = 'sling-student' WHERE "itemType" IN ('SLING_STUDENT', 'SLING_BUNDLE');
UPDATE "IdStockReceipt" SET "itemOptionId" = 'sling-employee' WHERE "itemType" = 'SLING_EMPLOYEE';
UPDATE "IdStockReceipt" SET "itemOptionId" = 'xid-color' WHERE "itemType" = 'XID_COLOR';
UPDATE "IdStockReceipt" SET "itemOptionId" = 'xid-film' WHERE "itemType" = 'XID_RETRANSFER_FILM';

-- AddForeignKey
ALTER TABLE "IdStockReceipt" ADD CONSTRAINT "IdStockReceipt_itemOptionId_fkey" FOREIGN KEY ("itemOptionId") REFERENCES "IdStockItemOption"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "IdStockReceipt_itemOptionId_idx" ON "IdStockReceipt"("itemOptionId");

-- New receipts for custom piece-only item types. Existing rows stay on their current values.
ALTER TYPE "IdStockItemType" ADD VALUE 'SUPPLY';
