-- Which use of this code by this customer a row is, starting at 1.
--
-- NOT NULL with no default is safe: DiscountRedemption was created by the
-- previous migration and holds no rows yet.

-- AlterTable
ALTER TABLE "DiscountRedemption" ADD COLUMN     "seq" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "DiscountRedemption_codeId_userId_seq_key" ON "DiscountRedemption"("codeId", "userId", "seq");
