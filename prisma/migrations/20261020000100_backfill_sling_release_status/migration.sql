UPDATE "IdReleaseEntry"
SET "status" = 'SLING'
WHERE "idCardsUsed" = 0
  AND "slingsUsed" > 0
  AND "status" = 'NEW_ID';
