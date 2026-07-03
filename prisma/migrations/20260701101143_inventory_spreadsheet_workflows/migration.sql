-- CreateTable
CREATE TABLE "IdErrorRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "personName" TEXT NOT NULL,
    "course" TEXT NOT NULL,
    "idNumber" TEXT NOT NULL,
    "datePrintedError" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'REPRINT',
    "reason" TEXT NOT NULL,
    "notes" TEXT,
    "studentId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "IdErrorRecord_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_BorrowRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "receivedItemId" TEXT NOT NULL,
    "borrowerName" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "quantityBorrowed" INTEGER NOT NULL DEFAULT 1,
    "dateBorrowed" DATETIME NOT NULL,
    "timeBorrowed" TEXT,
    "dateReturned" DATETIME,
    "timeReturned" TEXT,
    "returnerName" TEXT,
    "receivedByName" TEXT,
    "dueDate" DATETIME,
    "signatureConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BorrowRecord_receivedItemId_fkey" FOREIGN KEY ("receivedItemId") REFERENCES "ReceivedItem" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_BorrowRecord" ("borrowerName", "createdAt", "dateBorrowed", "dateReturned", "department", "id", "notes", "quantityBorrowed", "receivedItemId", "status") SELECT "borrowerName", "createdAt", "dateBorrowed", "dateReturned", "department", "id", "notes", "quantityBorrowed", "receivedItemId", "status" FROM "BorrowRecord";
DROP TABLE "BorrowRecord";
ALTER TABLE "new_BorrowRecord" RENAME TO "BorrowRecord";
CREATE TABLE "new_ReceivedItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "itemName" TEXT NOT NULL,
    "itemType" TEXT NOT NULL DEFAULT 'CONSUMABLE',
    "category" TEXT NOT NULL DEFAULT 'GENERAL',
    "inkColor" TEXT,
    "brand" TEXT,
    "model" TEXT,
    "color" TEXT,
    "serialNumber" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "senderName" TEXT NOT NULL,
    "senderSource" TEXT NOT NULL DEFAULT 'COC Main',
    "receivedByDepartment" TEXT NOT NULL DEFAULT 'IT- MAIN SCHOOL',
    "dateReceived" DATETIME NOT NULL,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_ReceivedItem" ("brand", "color", "createdAt", "dateReceived", "id", "itemName", "itemType", "model", "notes", "quantity", "senderName", "senderSource", "serialNumber") SELECT "brand", "color", "createdAt", "dateReceived", "id", "itemName", "itemType", "model", "notes", "quantity", "senderName", "senderSource", "serialNumber" FROM "ReceivedItem";
DROP TABLE "ReceivedItem";
ALTER TABLE "new_ReceivedItem" RENAME TO "ReceivedItem";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
