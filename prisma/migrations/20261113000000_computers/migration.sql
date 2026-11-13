CREATE TABLE "ComputerLocation" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "group" TEXT NOT NULL DEFAULT 'DEPARTMENT',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ComputerLocation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Computer" (
    "id" TEXT NOT NULL,
    "assetTag" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "seatLabel" TEXT,
    "assignedTo" TEXT,
    "brand" TEXT,
    "model" TEXT,
    "serialNumber" TEXT,
    "processor" TEXT,
    "ram" TEXT,
    "storage" TEXT,
    "operatingSystem" TEXT,
    "monitor" TEXT,
    "status" TEXT NOT NULL DEFAULT 'WORKING',
    "issue" TEXT,
    "dateAcquired" TIMESTAMP(3),
    "warrantyEnd" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Computer_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ComputerHistory" (
    "id" TEXT NOT NULL,
    "computerId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "detail" TEXT NOT NULL,
    "actor" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ComputerHistory_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ComputerLocation_group_name_key" ON "ComputerLocation"("group", "name");
CREATE INDEX "ComputerLocation_group_active_sortOrder_idx" ON "ComputerLocation"("group", "active", "sortOrder");
CREATE UNIQUE INDEX "Computer_assetTag_key" ON "Computer"("assetTag");
CREATE INDEX "Computer_locationId_idx" ON "Computer"("locationId");
CREATE INDEX "Computer_status_idx" ON "Computer"("status");
CREATE INDEX "ComputerHistory_computerId_createdAt_idx" ON "ComputerHistory"("computerId", "createdAt");
CREATE INDEX "ComputerHistory_createdAt_idx" ON "ComputerHistory"("createdAt");

ALTER TABLE "Computer" ADD CONSTRAINT "Computer_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "ComputerLocation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ComputerHistory" ADD CONSTRAINT "ComputerHistory_computerId_fkey" FOREIGN KEY ("computerId") REFERENCES "Computer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "ComputerLocation" ("id", "name", "group", "sortOrder", "updatedAt") VALUES
('cloc-comlab-1', 'COMLAB 1', 'COMLAB', 0, CURRENT_TIMESTAMP),
('cloc-library', 'Library', 'LIBRARY', 0, CURRENT_TIMESTAMP),
('cloc-dept-its', 'ITS', 'DEPARTMENT', 0, CURRENT_TIMESTAMP),
('cloc-dept-library', 'Library', 'DEPARTMENT', 1, CURRENT_TIMESTAMP),
('cloc-dept-registrar', 'Registrar', 'DEPARTMENT', 2, CURRENT_TIMESTAMP),
('cloc-dept-finance', 'Finance', 'DEPARTMENT', 3, CURRENT_TIMESTAMP),
('cloc-dept-csdl', 'CSDL', 'DEPARTMENT', 4, CURRENT_TIMESTAMP),
('cloc-dept-guidance', 'Guidance', 'DEPARTMENT', 5, CURRENT_TIMESTAMP),
('cloc-dept-marketing', 'Marketing', 'DEPARTMENT', 6, CURRENT_TIMESTAMP);
