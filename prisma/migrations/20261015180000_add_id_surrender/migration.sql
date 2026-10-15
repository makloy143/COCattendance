-- CreateTable
CREATE TABLE "IdSurrenderEntry" (
    "id" TEXT NOT NULL,
    "personName" TEXT NOT NULL,
    "course" TEXT NOT NULL,
    "yearLevel" TEXT,
    "idNumber" TEXT NOT NULL,
    "surrenderDate" TIMESTAMP(3) NOT NULL,
    "idCardsReturned" INTEGER NOT NULL DEFAULT 1,
    "slingsReturned" INTEGER NOT NULL DEFAULT 1,
    "receivedBy" TEXT NOT NULL,
    "notes" TEXT,
    "studentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IdSurrenderEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "IdSurrenderEntry_surrenderDate_idx" ON "IdSurrenderEntry"("surrenderDate");

-- CreateIndex
CREATE INDEX "IdSurrenderEntry_studentId_idx" ON "IdSurrenderEntry"("studentId");

-- AddForeignKey
ALTER TABLE "IdSurrenderEntry" ADD CONSTRAINT "IdSurrenderEntry_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE SET NULL ON UPDATE CASCADE;
