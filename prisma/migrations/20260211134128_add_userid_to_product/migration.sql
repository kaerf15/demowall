/*
  Warnings:

  - Added the required column `userId` to the `Product` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Product" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "detail" TEXT,
    "websiteUrl" TEXT NOT NULL,
    "imageUrl" TEXT,
    "githubUrl" TEXT,
    "twitterUrl" TEXT,
    "makerName" TEXT NOT NULL,
    "makerEmail" TEXT NOT NULL,
    "makerAvatar" TEXT,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "favorites" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "userId" INTEGER NOT NULL,
    CONSTRAINT "Product_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Product" ("createdAt", "description", "detail", "favorites", "githubUrl", "id", "imageUrl", "likes", "makerAvatar", "makerEmail", "makerName", "name", "published", "twitterUrl", "updatedAt", "websiteUrl") SELECT "createdAt", "description", "detail", "favorites", "githubUrl", "id", "imageUrl", "likes", "makerAvatar", "makerEmail", "makerName", "name", "published", "twitterUrl", "updatedAt", "websiteUrl" FROM "Product";
DROP TABLE "Product";
ALTER TABLE "new_Product" RENAME TO "Product";
CREATE UNIQUE INDEX "Product_userId_name_key" ON "Product"("userId", "name");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
