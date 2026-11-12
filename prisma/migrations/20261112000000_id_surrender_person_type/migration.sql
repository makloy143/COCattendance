-- Withdrawals can now be recorded for faculty as well as students.
-- Existing records are all student withdrawals.
ALTER TABLE "IdSurrenderEntry" ADD COLUMN "personType" TEXT NOT NULL DEFAULT 'STUDENT';
