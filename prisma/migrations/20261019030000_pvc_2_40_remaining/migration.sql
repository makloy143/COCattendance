ALTER TABLE "IdStockReceipt" ADD COLUMN "openingRemaining" INTEGER;
ALTER TABLE "IdStockReceipt" ADD COLUMN "balanceRecordedAt" TIMESTAMP(3);

-- PLAIN WHITE PVC CARD #2/40 is already in use: 108 cards are left.
-- Releases recorded before this balance stay in history and do not reduce it again.
UPDATE "IdStockReceipt"
SET "openingRemaining" = 108,
    "balanceRecordedAt" = CURRENT_TIMESTAMP
WHERE regexp_replace(btrim(COALESCE("descriptionCode", '')), '^#+', '') ~* '^2/40$'
  AND (
    "itemType" IN ('ID_CARD', 'ID_CARD_BOX')
    OR EXISTS (
      SELECT 1
      FROM "IdStockItemOption" option
      WHERE option."id" = "IdStockReceipt"."itemOptionId"
        AND option."category" = 'ID_CARD'
    )
  );
