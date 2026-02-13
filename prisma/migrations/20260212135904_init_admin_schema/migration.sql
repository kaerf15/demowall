-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_AuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "adminId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "details" TEXT,
    "ipAddress" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_AuditLog" ("action", "adminId", "createdAt", "details", "id", "ipAddress", "targetId", "targetType") SELECT "action", "adminId", "createdAt", "details", "id", "ipAddress", "targetId", "targetType" FROM "AuditLog";
DROP TABLE "AuditLog";
ALTER TABLE "new_AuditLog" RENAME TO "AuditLog";
CREATE TABLE "new_DailyStat" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" TEXT NOT NULL,
    "newUsers" INTEGER NOT NULL DEFAULT 0,
    "activeUsers" INTEGER NOT NULL DEFAULT 0,
    "newProducts" INTEGER NOT NULL DEFAULT 0,
    "totalUsers" INTEGER NOT NULL DEFAULT 0,
    "totalProducts" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_DailyStat" ("activeUsers", "createdAt", "date", "id", "newProducts", "newUsers", "totalProducts", "totalUsers") SELECT "activeUsers", "createdAt", "date", "id", "newProducts", "newUsers", "totalProducts", "totalUsers" FROM "DailyStat";
DROP TABLE "DailyStat";
ALTER TABLE "new_DailyStat" RENAME TO "DailyStat";
CREATE UNIQUE INDEX "DailyStat_date_key" ON "DailyStat"("date");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
