ALTER TABLE "IdMaintenanceSettings" ALTER COLUMN "cardsPerBox" SET DEFAULT 250;

UPDATE "IdMaintenanceSettings"
SET "cardsPerBox" = 250
WHERE "id" = 'default';
