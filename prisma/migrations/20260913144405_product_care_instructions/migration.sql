-- Per-product care and cleaning copy for the PDP accordion.
--
-- Nullable with no default: the "Care & cleaning" section already carries
-- generic house copy, which keeps showing wherever this is blank. Existing
-- products therefore read exactly as they did before this ran.
ALTER TABLE "Product" ADD COLUMN "careInstructions" TEXT;
