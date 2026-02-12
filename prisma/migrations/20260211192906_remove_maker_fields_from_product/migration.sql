/*
  Warnings:

  - You are about to drop the column `makerAvatar` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `makerEmail` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `makerName` on the `Product` table. All the data in the column will be lost.

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
    "likes" INTEGER NOT NULL DEFAULT 0,
    "favorites" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "userId" INTEGER NOT NULL,
    CONSTRAINT "Product_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Product" ("createdAt", "description", "detail", "favorites", "githubUrl", "id", "imageUrl", "likes", "name", "published", "twitterUrl", "updatedAt", "userId", "websiteUrl") SELECT "createdAt", "description", "detail", "favorites", "githubUrl", "id", "imageUrl", "likes", "name", "published", "twitterUrl", "updatedAt", "userId", "websiteUrl" FROM "Product";
DROP TABLE "Product";
ALTER TABLE "new_Product" RENAME TO "Product";
CREATE UNIQUE INDEX "Product_userId_name_key" ON "Product"("userId", "name");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
