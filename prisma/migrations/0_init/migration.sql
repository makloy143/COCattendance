-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "StudentType" AS ENUM ('SA', 'HK');

-- CreateEnum
CREATE TYPE "StudentAssignment" AS ENUM ('COMLAB', 'ID_STATION', 'ITS_OFFICE');

-- CreateEnum
CREATE TYPE "ItemType" AS ENUM ('CONSUMABLE', 'EQUIPMENT');

-- CreateEnum
CREATE TYPE "ItemCategory" AS ENUM ('GENERAL', 'INK', 'ID_SUPPLIES');

-- CreateEnum
CREATE TYPE "InkColor" AS ENUM ('BLACK', 'MAGENTA', 'CYAN', 'YELLOW', 'OTHER');

-- CreateEnum
CREATE TYPE "BorrowStatus" AS ENUM ('ACTIVE', 'RETURNED');

-- CreateEnum
CREATE TYPE "IdErrorStatus" AS ENUM ('REPRINT', 'RESOLVED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "MonitoringCategory" AS ENUM ('INTERNET', 'NETWORK_SECURITY_CLOUD', 'APPLICATIONS', 'COM_LAB');

-- CreateTable
CREATE TABLE "Admin" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Admin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryAdmin" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InventoryAdmin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MonitoringAdmin" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MonitoringAdmin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Student" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "course" TEXT,
    "yearLevel" TEXT,
    "studentType" "StudentType" NOT NULL DEFAULT 'SA',
    "assignment" "StudentAssignment" NOT NULL DEFAULT 'COMLAB',
    "photoUrl" TEXT,
    "qrToken" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Student_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentPhoto" (
    "studentId" TEXT NOT NULL,
    "data" BYTEA NOT NULL,
    "mimeType" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentPhoto_pkey" PRIMARY KEY ("studentId")
);

-- CreateTable
CREATE TABLE "StudentScheduleSlot" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "StudentScheduleSlot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AttendanceRecord" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "timeIn" TIMESTAMP(3),
    "timeOut" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AttendanceRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReceivedItem" (
    "id" TEXT NOT NULL,
    "itemName" TEXT NOT NULL,
    "itemType" "ItemType" NOT NULL DEFAULT 'CONSUMABLE',
    "category" "ItemCategory" NOT NULL DEFAULT 'GENERAL',
    "inkColor" "InkColor",
    "brand" TEXT,
    "model" TEXT,
    "color" TEXT,
    "serialNumber" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "senderName" TEXT NOT NULL,
    "senderSource" TEXT NOT NULL DEFAULT 'COC Main',
    "receivedByDepartment" TEXT NOT NULL DEFAULT 'IT- MAIN SCHOOL',
    "dateReceived" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReceivedItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BorrowRecord" (
    "id" TEXT NOT NULL,
    "receivedItemId" TEXT NOT NULL,
    "borrowerName" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "quantityBorrowed" INTEGER NOT NULL DEFAULT 1,
    "dateBorrowed" TIMESTAMP(3) NOT NULL,
    "timeBorrowed" TEXT,
    "dateReturned" TIMESTAMP(3),
    "timeReturned" TEXT,
    "returnerName" TEXT,
    "receivedByName" TEXT,
    "dueDate" TIMESTAMP(3),
    "signatureConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "status" "BorrowStatus" NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BorrowRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IdErrorRecord" (
    "id" TEXT NOT NULL,
    "personName" TEXT NOT NULL,
    "course" TEXT NOT NULL,
    "idNumber" TEXT NOT NULL,
    "datePrintedError" TIMESTAMP(3) NOT NULL,
    "status" "IdErrorStatus" NOT NULL DEFAULT 'REPRINT',
    "reason" TEXT NOT NULL,
    "notes" TEXT,
    "studentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IdErrorRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MonitoringSystem" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "MonitoringCategory" NOT NULL,
    "accountNo" TEXT,
    "sortOrder" INTEGER NOT NULL,

    CONSTRAINT "MonitoringSystem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MonitoringReport" (
    "id" TEXT NOT NULL,
    "reportDate" TIMESTAMP(3) NOT NULL,
    "shiftType" TEXT NOT NULL DEFAULT 'IN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MonitoringReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MonitoringReportEntry" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "systemId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Up',
    "accountNo" TEXT,
    "uptime" TEXT,
    "downtime" TEXT,
    "restoration" TEXT,
    "userExperience" TEXT,
    "remarks" TEXT,

    CONSTRAINT "MonitoringReportEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Admin_username_key" ON "Admin"("username");

-- CreateIndex
CREATE UNIQUE INDEX "InventoryAdmin_username_key" ON "InventoryAdmin"("username");

-- CreateIndex
CREATE UNIQUE INDEX "MonitoringAdmin_username_key" ON "MonitoringAdmin"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Student_studentId_key" ON "Student"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "Student_qrToken_key" ON "Student"("qrToken");

-- CreateIndex
CREATE UNIQUE INDEX "StudentScheduleSlot_studentId_dayOfWeek_key" ON "StudentScheduleSlot"("studentId", "dayOfWeek");

-- CreateIndex
CREATE UNIQUE INDEX "AttendanceRecord_studentId_date_key" ON "AttendanceRecord"("studentId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "MonitoringSystem_category_name_key" ON "MonitoringSystem"("category", "name");

-- CreateIndex
CREATE UNIQUE INDEX "MonitoringReport_reportDate_key" ON "MonitoringReport"("reportDate");

-- CreateIndex
CREATE UNIQUE INDEX "MonitoringReportEntry_reportId_systemId_key" ON "MonitoringReportEntry"("reportId", "systemId");

-- AddForeignKey
ALTER TABLE "StudentPhoto" ADD CONSTRAINT "StudentPhoto_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentScheduleSlot" ADD CONSTRAINT "StudentScheduleSlot_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceRecord" ADD CONSTRAINT "AttendanceRecord_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BorrowRecord" ADD CONSTRAINT "BorrowRecord_receivedItemId_fkey" FOREIGN KEY ("receivedItemId") REFERENCES "ReceivedItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IdErrorRecord" ADD CONSTRAINT "IdErrorRecord_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MonitoringReportEntry" ADD CONSTRAINT "MonitoringReportEntry_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "MonitoringReport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MonitoringReportEntry" ADD CONSTRAINT "MonitoringReportEntry_systemId_fkey" FOREIGN KEY ("systemId") REFERENCES "MonitoringSystem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
