-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Student" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "studentId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "course" TEXT,
    "yearLevel" TEXT,
    "studentType" TEXT NOT NULL DEFAULT 'SA',
    "assignment" TEXT NOT NULL DEFAULT 'COMLAB',
    "photoUrl" TEXT,
    "qrToken" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Student" (
    "id",
    "studentId",
    "firstName",
    "lastName",
    "email",
    "phone",
    "course",
    "yearLevel",
    "studentType",
    "assignment",
    "photoUrl",
    "qrToken",
    "isActive",
    "createdAt"
)
SELECT
    "id",
    "studentId",
    "firstName",
    "lastName",
    "email",
    "phone",
    "course",
    "yearLevel",
    COALESCE("role", 'SA'),
    'COMLAB',
    "photoUrl",
    "qrToken",
    "isActive",
    "createdAt"
FROM "Student";
DROP TABLE "Student";
ALTER TABLE "new_Student" RENAME TO "Student";
CREATE UNIQUE INDEX "Student_studentId_key" ON "Student"("studentId");
CREATE UNIQUE INDEX "Student_qrToken_key" ON "Student"("qrToken");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
