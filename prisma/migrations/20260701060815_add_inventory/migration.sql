-- CreateTable
CREATE TABLE "ReceivedItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "itemName" TEXT NOT NULL,
    "itemType" TEXT NOT NULL DEFAULT 'CONSUMABLE',
    "brand" TEXT,
    "model" TEXT,
    "color" TEXT,
    "serialNumber" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "senderName" TEXT NOT NULL,
    "senderSource" TEXT NOT NULL DEFAULT 'COC Main',
    "dateReceived" DATETIME NOT NULL,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "BorrowRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "receivedItemId" TEXT NOT NULL,
    "borrowerName" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "quantityBorrowed" INTEGER NOT NULL DEFAULT 1,
    "dateBorrowed" DATETIME NOT NULL,
    "dateReturned" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BorrowRecord_receivedItemId_fkey" FOREIGN KEY ("receivedItemId") REFERENCES "ReceivedItem" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
