CREATE TABLE "InkOfficeSettings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "lowStockAtMost" INTEGER NOT NULL DEFAULT 2,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InkOfficeSettings_pkey" PRIMARY KEY ("id")
);

INSERT INTO "InkOfficeSettings" ("id", "lowStockAtMost", "updatedAt")
VALUES ('default', 2, CURRENT_TIMESTAMP);

CREATE TABLE "InkModelOption" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "inkColor" "InkColor" NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InkModelOption_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "InkModelOption_active_sortOrder_idx" ON "InkModelOption"("active", "sortOrder");

INSERT INTO "InkModelOption" ("id", "name", "inkColor", "sortOrder", "active", "createdAt", "updatedAt") VALUES
('ink-bk-664', 'BK 664', 'BLACK', 0, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('ink-mg-664', 'MG 664', 'MAGENTA', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('ink-cy-664', 'CY 664', 'CYAN', 2, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('ink-yl-664', 'YL 664', 'YELLOW', 3, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('ink-bk-003', 'BK 003', 'BLACK', 4, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('ink-mg-003', 'MG 003', 'MAGENTA', 5, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('ink-cy-003', 'CY 003', 'CYAN', 6, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('ink-yl-003', 'YL 003', 'YELLOW', 7, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('ink-bk-gt52', 'BK HP GT52', 'BLACK', 8, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('ink-mg-gt52', 'MG HP GT52', 'MAGENTA', 9, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('ink-cy-gt52', 'CY HP GT52', 'CYAN', 10, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('ink-yl-gt52', 'YL HP GT52', 'YELLOW', 11, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
