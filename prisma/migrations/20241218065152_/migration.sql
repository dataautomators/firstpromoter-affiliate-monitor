/*
  Warnings:

  - You are about to alter the column `schedule` on the `Promoter` table. The data in that column could be lost. The data in that column will be cast from `String` to `Int`.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Promoter" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "source" TEXT NOT NULL,
    "companyHost" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "schedule" INTEGER,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "manualRun" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "userId" TEXT NOT NULL,
    CONSTRAINT "Promoter_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("clerkId") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Promoter" ("accessToken", "companyHost", "createdAt", "email", "id", "isEnabled", "manualRun", "password", "refreshToken", "schedule", "source", "updatedAt", "userId") SELECT "accessToken", "companyHost", "createdAt", "email", "id", "isEnabled", "manualRun", "password", "refreshToken", "schedule", "source", "updatedAt", "userId" FROM "Promoter";
DROP TABLE "Promoter";
ALTER TABLE "new_Promoter" RENAME TO "Promoter";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
