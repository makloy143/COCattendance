-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_MonitoringReport" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reportDate" DATETIME NOT NULL,
    "shiftType" TEXT NOT NULL DEFAULT 'IN',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_MonitoringReport" ("createdAt", "id", "reportDate", "updatedAt") SELECT "createdAt", "id", "reportDate", "updatedAt" FROM "MonitoringReport";
DROP TABLE "MonitoringReport";
ALTER TABLE "new_MonitoringReport" RENAME TO "MonitoringReport";
CREATE UNIQUE INDEX "MonitoringReport_reportDate_key" ON "MonitoringReport"("reportDate");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
