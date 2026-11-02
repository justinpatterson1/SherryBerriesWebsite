-- CreateEnum
CREATE TYPE "PopupKind" AS ENUM ('ANNOUNCEMENT', 'NEWSLETTER');

-- CreateEnum
CREATE TYPE "PopupLayout" AS ENUM ('IMAGE_TEXT', 'FULL_GRAPHIC');

-- CreateEnum
CREATE TYPE "PopupPlacement" AS ENUM ('SITE', 'CHECKOUT_COMPLETE');

-- CreateEnum
CREATE TYPE "PopupFrequency" AS ENUM ('ONCE', 'SESSION', 'DAILY');

-- CreateTable
CREATE TABLE "Popup" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kind" "PopupKind" NOT NULL,
    "layout" "PopupLayout" NOT NULL DEFAULT 'IMAGE_TEXT',
    "placement" "PopupPlacement" NOT NULL DEFAULT 'SITE',
    "imageUrl" TEXT,
    "headline" TEXT NOT NULL,
    "body" TEXT,
    "ctaLabel" TEXT,
    "productId" TEXT,
    "ctaUrl" TEXT,
    "showCountdown" BOOLEAN NOT NULL DEFAULT false,
    "promoCodeId" TEXT,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "frequency" "PopupFrequency" NOT NULL DEFAULT 'ONCE',
    "delaySeconds" INTEGER NOT NULL DEFAULT 2,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Popup_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Popup_active_placement_idx" ON "Popup"("active", "placement");

-- AddForeignKey
ALTER TABLE "Popup" ADD CONSTRAINT "Popup_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Popup" ADD CONSTRAINT "Popup_promoCodeId_fkey" FOREIGN KEY ("promoCodeId") REFERENCES "DiscountCode"("id") ON DELETE SET NULL ON UPDATE CASCADE;
