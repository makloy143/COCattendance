-- CreateTable
CREATE TABLE "AttendanceDepartmentOption" (
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AttendanceDepartmentOption_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "StudentAssignmentOption" (
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StudentAssignmentOption_pkey" PRIMARY KEY ("code")
);

-- Seed existing attendance departments
INSERT INTO "AttendanceDepartmentOption" ("code", "label", "sortOrder") VALUES
  ('REGISTRAR', 'Registrar', 0),
  ('FINANCE', 'Finance', 1),
  ('CSDL', 'CSDL', 2),
  ('LIBRARY', 'Library', 3),
  ('MARKETING', 'Marketing', 4),
  ('GSD', 'GSD', 5),
  ('GUIDANCE', 'Guidance', 6),
  ('ITSD', 'ITSD', 7);

-- Seed existing assign-to options
INSERT INTO "StudentAssignmentOption" ("code", "label", "sortOrder") VALUES
  ('REGISTRAR', 'Registrar', 0),
  ('FINANCE', 'Finance', 1),
  ('ACCOUNTING', 'Accounting', 2),
  ('GUIDANCE', 'Guidance', 3),
  ('CSDL', 'CSDL', 4),
  ('ADMIN', 'Admin', 5),
  ('FACULTY', 'Faculty', 6),
  ('MARKETING', 'Marketing', 7),
  ('OTHERS', 'Others', 8);

-- Convert Admin.department from enum to text
ALTER TABLE "Admin" ALTER COLUMN "department" TYPE TEXT USING "department"::text;

-- Convert Student.department from enum to text
ALTER TABLE "Student" ALTER COLUMN "department" DROP DEFAULT;
ALTER TABLE "Student" ALTER COLUMN "department" TYPE TEXT USING "department"::text;
ALTER TABLE "Student" ALTER COLUMN "department" SET DEFAULT 'ITSD';

-- Convert Student.assignment from enum to text
ALTER TABLE "Student" ALTER COLUMN "assignment" DROP DEFAULT;
ALTER TABLE "Student" ALTER COLUMN "assignment" TYPE TEXT USING "assignment"::text;
ALTER TABLE "Student" ALTER COLUMN "assignment" SET DEFAULT 'REGISTRAR';

-- DropEnum
DROP TYPE "Department";
DROP TYPE "StudentAssignment";
