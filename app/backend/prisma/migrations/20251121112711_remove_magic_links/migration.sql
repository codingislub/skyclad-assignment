/*
  Warnings:

  - You are about to drop the `magic_links` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "magic_links" DROP CONSTRAINT "magic_links_userId_fkey";

-- DropTable
DROP TABLE "magic_links";
