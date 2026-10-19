-- PLAIN WHITE PVC CARD #2/40 has 109 pieces. The cards already released
-- belong on that card. #4/40 stays unused until #2/40 is finished.
UPDATE "IdStockReceipt"
SET "openingRemaining" = NULL,
    "balanceRecordedAt" = NULL
WHERE regexp_replace(btrim(COALESCE("descriptionCode", '')), '^#+', '') ~* '^2/40$';

UPDATE "IdReleaseEntry"
SET
  "pvcCardId" = (
    SELECT receipt."id"
    FROM "IdStockReceipt" AS receipt
    WHERE regexp_replace(btrim(COALESCE(receipt."descriptionCode", '')), '^#+', '') ~* '^2/40$'
      AND (
        receipt."itemType" IN ('ID_CARD', 'ID_CARD_BOX')
        OR EXISTS (
          SELECT 1
          FROM "IdStockItemOption" AS option
          WHERE option."id" = receipt."itemOptionId"
            AND option."category" = 'ID_CARD'
        )
      )
    ORDER BY receipt."dateReceived" DESC, receipt."createdAt" DESC
    LIMIT 1
  ),
  "pvcCardName" = 'PLAIN WHITE PVC CARD #2/40'
WHERE "idCardsUsed" > 0
  AND EXISTS (
    SELECT 1
    FROM "IdStockReceipt" AS receipt
    WHERE regexp_replace(btrim(COALESCE(receipt."descriptionCode", '')), '^#+', '') ~* '^2/40$'
      AND (
        receipt."itemType" IN ('ID_CARD', 'ID_CARD_BOX')
        OR EXISTS (
          SELECT 1
          FROM "IdStockItemOption" AS option
          WHERE option."id" = receipt."itemOptionId"
            AND option."category" = 'ID_CARD'
        )
      )
  );
