-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "digitalNotifiedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "digitalFileKey" TEXT,
ADD COLUMN     "digitalFileName" TEXT,
ADD COLUMN     "isDigital" BOOLEAN NOT NULL DEFAULT false;
