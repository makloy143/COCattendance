-- CreateTable
CREATE TABLE "InventoryCatalogItem" (
    "id" TEXT NOT NULL,
    "itemName" TEXT NOT NULL,
    "itemType" "ItemType" NOT NULL DEFAULT 'CONSUMABLE',
    "category" "ItemCategory" NOT NULL DEFAULT 'GENERAL',
    "inkColor" "InkColor",
    "brand" TEXT,
    "model" TEXT,
    "color" TEXT,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InventoryCatalogItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "InventoryCatalogItem_category_idx" ON "InventoryCatalogItem"("category");

-- CreateIndex
CREATE INDEX "InventoryCatalogItem_itemType_idx" ON "InventoryCatalogItem"("itemType");

-- CreateIndex
CREATE INDEX "InventoryCatalogItem_isActive_idx" ON "InventoryCatalogItem"("isActive");

-- CreateIndex
CREATE INDEX "InventoryCatalogItem_itemName_idx" ON "InventoryCatalogItem"("itemName");
