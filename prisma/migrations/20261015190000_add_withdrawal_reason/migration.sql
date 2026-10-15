-- Existing withdrawal rows keep a reason so the column can be required.
ALTER TABLE "IdSurrenderEntry" ADD COLUMN "reason" TEXT NOT NULL DEFAULT 'WITHDRAWAL';
