CREATE TABLE "InventoryDepartment" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InventoryDepartment_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "InventoryDepartment_name_key" ON "InventoryDepartment"("name");
CREATE INDEX "InventoryDepartment_active_sortOrder_idx" ON "InventoryDepartment"("active", "sortOrder");

INSERT INTO "InventoryDepartment" ("id", "name", "sortOrder", "updatedAt") VALUES
('dept-it-main-school', 'IT- MAIN SCHOOL', 0, CURRENT_TIMESTAMP),
('dept-itsd', 'ITSD', 1, CURRENT_TIMESTAMP),
('dept-marketing', 'MARKETING', 2, CURRENT_TIMESTAMP),
('dept-finance', 'FINANCE', 3, CURRENT_TIMESTAMP),
('dept-registrar', 'REGISTRAR', 4, CURRENT_TIMESTAMP),
('dept-guidance', 'GUIDANCE', 5, CURRENT_TIMESTAMP),
('dept-library', 'LIBRARY', 6, CURRENT_TIMESTAMP),
('dept-clinic', 'CLINIC', 7, CURRENT_TIMESTAMP),
('dept-faculty', 'FACULTY', 8, CURRENT_TIMESTAMP),
('dept-student', 'STUDENT', 9, CURRENT_TIMESTAMP),
('dept-comlab', 'COMLAB', 10, CURRENT_TIMESTAMP),
('dept-its-office', 'ITS OFFICE', 11, CURRENT_TIMESTAMP);
