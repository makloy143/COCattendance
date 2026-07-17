-- CreateEnum
CREATE TYPE "CheckCadence" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY');

-- CreateEnum
CREATE TYPE "CheckCategory" AS ENUM ('INK', 'TECHNICAL', 'OTHER');

-- CreateEnum
CREATE TYPE "CheckStatus" AS ENUM ('PENDING', 'COMPLETED', 'ISSUE_FOUND', 'SKIPPED');

-- CreateTable
CREATE TABLE "DepartmentCheckAdmin" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DepartmentCheckAdmin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CheckTemplate" (
    "id" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" "CheckCategory" NOT NULL DEFAULT 'OTHER',
    "cadence" "CheckCadence" NOT NULL DEFAULT 'WEEKLY',
    "dayOfWeek" INTEGER,
    "dayOfMonth" INTEGER,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CheckTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DepartmentCheckLog" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "checkDate" TIMESTAMP(3) NOT NULL,
    "status" "CheckStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "checkedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DepartmentCheckLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DepartmentCheckAdmin_username_key" ON "DepartmentCheckAdmin"("username");

-- CreateIndex
CREATE UNIQUE INDEX "DepartmentCheckLog_templateId_checkDate_key" ON "DepartmentCheckLog"("templateId", "checkDate");

-- AddForeignKey
ALTER TABLE "DepartmentCheckLog" ADD CONSTRAINT "DepartmentCheckLog_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "CheckTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
