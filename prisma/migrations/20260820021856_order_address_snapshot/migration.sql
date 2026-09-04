-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "shipCity" TEXT,
ADD COLUMN     "shipEmail" TEXT,
ADD COLUMN     "shipLandmark" TEXT,
ADD COLUMN     "shipLine1" TEXT,
ADD COLUMN     "shipName" TEXT,
ADD COLUMN     "shipPhone" TEXT;

-- Backfill from the JSON the checkout has been stuffing into `notes` as a
-- workaround, so existing real orders keep the address they actually shipped to
-- instead of falling back to the customer's current default.
--
-- Row-by-row with a per-row exception handler on purpose: `notes` is TEXT, not
-- jsonb, and seeded orders put a plain lorem sentence there. A set-based
-- `notes::jsonb` would abort the whole statement on the first one. Rows whose
-- notes are not the expected shape are simply left unsnapshotted, which is
-- correct — they never had an address.
DO $$
DECLARE
  r RECORD;
  j JSONB;
BEGIN
  FOR r IN SELECT "id", "notes" FROM "Order" WHERE "notes" LIKE '{%' LOOP
    BEGIN
      j := r."notes"::jsonb;
      UPDATE "Order" SET
        "shipName" = NULLIF(trim(concat_ws(' ',
          j -> 'contact' ->> 'firstName',
          j -> 'contact' ->> 'lastName')), ''),
        "shipPhone"    = j -> 'contact' ->> 'phone',
        "shipEmail"    = j -> 'contact' ->> 'email',
        "shipLine1"    = j -> 'address' ->> 'line1',
        "shipCity"     = j -> 'address' ->> 'city',
        "shipLandmark" = j -> 'address' ->> 'landmark'
      WHERE "id" = r."id";
    EXCEPTION WHEN others THEN
      -- Unparseable or unexpected shape: leave this order without a snapshot.
      NULL;
    END;
  END LOOP;
END $$;
