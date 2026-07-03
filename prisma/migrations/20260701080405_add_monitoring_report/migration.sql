-- CreateTable
CREATE TABLE "MonitoringSystem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "accountNo" TEXT,
    "sortOrder" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "MonitoringReport" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reportDate" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "MonitoringReportEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reportId" TEXT NOT NULL,
    "systemId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Up',
    "accountNo" TEXT,
    "uptime" TEXT,
    "downtime" TEXT,
    "restoration" TEXT,
    "userExperience" TEXT,
    "remarks" TEXT,
    CONSTRAINT "MonitoringReportEntry_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "MonitoringReport" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MonitoringReportEntry_systemId_fkey" FOREIGN KEY ("systemId") REFERENCES "MonitoringSystem" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "MonitoringSystem_category_name_key" ON "MonitoringSystem"("category", "name");

-- CreateIndex
CREATE UNIQUE INDEX "MonitoringReport_reportDate_key" ON "MonitoringReport"("reportDate");

-- CreateIndex
CREATE UNIQUE INDEX "MonitoringReportEntry_reportId_systemId_key" ON "MonitoringReportEntry"("reportId", "systemId");
