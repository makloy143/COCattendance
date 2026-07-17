-- Replace StudentAssignment enum with updated assign-to options.
CREATE TYPE "StudentAssignment_new" AS ENUM (
  'REGISTRAR',
  'FINANCE',
  'ACCOUNTING',
  'GUIDANCE',
  'CSDL',
  'ADMIN',
  'FACULTY',
  'OTHERS'
);

ALTER TABLE "Student" ALTER COLUMN "assignment" DROP DEFAULT;

ALTER TABLE "Student"
ALTER COLUMN "assignment" TYPE "StudentAssignment_new"
USING (
  CASE "assignment"::text
    WHEN 'COMLAB' THEN 'OTHERS'::"StudentAssignment_new"
    WHEN 'ID_STATION' THEN 'OTHERS'::"StudentAssignment_new"
    WHEN 'ITS_OFFICE' THEN 'OTHERS'::"StudentAssignment_new"
    ELSE 'REGISTRAR'::"StudentAssignment_new"
  END
);

DROP TYPE "StudentAssignment";

ALTER TYPE "StudentAssignment_new" RENAME TO "StudentAssignment";

ALTER TABLE "Student" ALTER COLUMN "assignment" SET DEFAULT 'REGISTRAR';
