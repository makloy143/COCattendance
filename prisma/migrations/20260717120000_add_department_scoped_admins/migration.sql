-- CreateEnum
CREATE TYPE "Department" AS ENUM ('REGISTRAR', 'FINANCE', 'CSDL', 'LIBRARY', 'MARKETING', 'GSD', 'GUIDANCE', 'ITSD');

-- AlterTable
ALTER TABLE "Admin" ADD COLUMN "department" "Department";

-- AlterTable
ALTER TABLE "Student" ADD COLUMN "department" "Department" NOT NULL DEFAULT 'ITSD';

-- DropIndex
DROP INDEX IF EXISTS "Student_studentId_key";

-- CreateIndex
CREATE UNIQUE INDEX "Student_department_studentId_key" ON "Student"("department", "studentId");
