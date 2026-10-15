-- CreateEnum
CREATE TYPE "IdReceiptUnit" AS ENUM ('BOX', 'PIECE');

-- CreateEnum
CREATE TYPE "IdSlingKind" AS ENUM ('STUDENT', 'EMPLOYEE');

-- AlterTable
ALTER TABLE "IdStockReceipt" ADD COLUMN "unit" "IdReceiptUnit" NOT NULL DEFAULT 'BOX';

-- AlterTable
ALTER TABLE "IdStockReceipt" ADD COLUMN "descriptionCode" TEXT;

-- AlterTable
ALTER TABLE "IdReleaseEntry" ADD COLUMN "slingKind" "IdSlingKind";

-- New item types. Existing receipts stay on ID_CARD_BOX / SLING_BUNDLE.
ALTER TYPE "IdStockItemType" ADD VALUE 'ID_CARD';
ALTER TYPE "IdStockItemType" ADD VALUE 'SLING_STUDENT';
ALTER TYPE "IdStockItemType" ADD VALUE 'SLING_EMPLOYEE';
ALTER TYPE "IdStockItemType" ADD VALUE 'XID_COLOR';
ALTER TYPE "IdStockItemType" ADD VALUE 'XID_RETRANSFER_FILM';
