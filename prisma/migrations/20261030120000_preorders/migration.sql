-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "isPreorder" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN     "isPreorder" BOOLEAN NOT NULL DEFAULT false;
