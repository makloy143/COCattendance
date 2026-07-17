-- Backfill department for existing attendance admins created before department scoping.
UPDATE "Admin"
SET "department" = 'ITSD'
WHERE "username" = 'admin'
  AND "department" IS NULL;

UPDATE "Admin"
SET "department" = 'REGISTRAR'
WHERE "username" = 'registrar'
  AND "department" IS NULL;
