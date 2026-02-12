/*
  Warnings:

  - You are about to drop the column `published` on the `Product` table. All the data in the column will be lost.

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
    "images" TEXT,
    "githubUrl" TEXT,
    "twitterUrl" TEXT,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "favorites" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "userId" TEXT NOT NULL,
    CONSTRAINT "Product_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Product" ("createdAt", "description", "detail", "favorites", "githubUrl", "id", "imageUrl", "images", "likes", "name", "twitterUrl", "updatedAt", "userId", "websiteUrl", "status") SELECT "createdAt", "description", "detail", "favorites", "githubUrl", "id", "imageUrl", "images", "likes", "name", "twitterUrl", "updatedAt", "userId", "websiteUrl", CASE WHEN "published" = 1 THEN 'PUBLISHED' ELSE 'DRAFT' END FROM "Product";
DROP TABLE "Product";
ALTER TABLE "new_Product" RENAME TO "Product";
CREATE INDEX "Product_userId_idx" ON "Product"("userId");
CREATE INDEX "Product_status_idx" ON "Product"("status");
CREATE UNIQUE INDEX "Product_userId_name_key" ON "Product"("userId", "name");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
