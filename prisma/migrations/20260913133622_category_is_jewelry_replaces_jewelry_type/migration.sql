-- Category becomes the single product taxonomy.
--
-- `Product.jewelryType` was a Prisma enum, so only a developer running a
-- migration could add a value. Category is a table with admin CRUD, which meant
-- the admin could create "Tongue Rings" but not a matching jewelry type — two
-- overlapping taxonomies, one of them uneditable.
--
-- The enum carried exactly one behaviour that Category could not already
-- express: hiding AFTERCARE and ELIXIR products from the unfiltered Jewelry
-- listing. That becomes a column here.

-- 1. The flag. Defaults true so existing and future categories are jewelry
--    unless explicitly marked otherwise — failing visible rather than hiding
--    stock silently.
ALTER TABLE "Category" ADD COLUMN "isJewelry" BOOLEAN NOT NULL DEFAULT true;

-- 2. Carry the old exclusions over. `accessories` and `merch` are included
--    because the seed filed both under the AFTERCARE catch-all, so both were
--    already excluded from the Jewelry listing — preserving behaviour rather
--    than quietly changing it.
UPDATE "Category"
SET "isJewelry" = false
WHERE "slug" IN ('aftercare', 'elixirs', 'accessories', 'merch');

-- 3. Drop the enum column and the type itself. The 14 products currently in the
--    database keep their category, which is now the only taxonomy that matters.
ALTER TABLE "Product" DROP COLUMN "jewelryType";

DROP TYPE "JewelryType";
