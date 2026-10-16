-- XID printer color and retransfer film are received as boxes.
UPDATE "IdStockReceipt" AS r
SET unit = 'BOX'
FROM "IdStockItemOption" AS o
WHERE r."itemOptionId" = o.id
  AND o.category = 'SUPPLY'
  AND r.unit = 'PIECE';

UPDATE "IdStockReceipt"
SET unit = 'BOX'
WHERE "itemType" IN ('XID_COLOR', 'XID_RETRANSFER_FILM', 'SUPPLY')
  AND unit = 'PIECE';
