-- Newsletter list: give every subscriber an unsubscribe token, and record
-- where they signed up and whether they have since opted out.
--
-- Hand-written rather than generated: the table already holds rows, so a
-- required `unsubscribeToken` cannot be added in one step. It goes in nullable,
-- gets backfilled, and only then becomes NOT NULL + UNIQUE.

ALTER TABLE "NewsletterSubscriber" ADD COLUMN "source" TEXT;
ALTER TABLE "NewsletterSubscriber" ADD COLUMN "unsubscribedAt" TIMESTAMP(3);
ALTER TABLE "NewsletterSubscriber" ADD COLUMN "unsubscribeToken" TEXT;

-- gen_random_uuid() is built in from PostgreSQL 13; Neon is well past that.
UPDATE "NewsletterSubscriber"
SET "unsubscribeToken" = replace(gen_random_uuid()::text, '-', '')
WHERE "unsubscribeToken" IS NULL;

ALTER TABLE "NewsletterSubscriber" ALTER COLUMN "unsubscribeToken" SET NOT NULL;

CREATE UNIQUE INDEX "NewsletterSubscriber_unsubscribeToken_key"
  ON "NewsletterSubscriber"("unsubscribeToken");

CREATE INDEX "NewsletterSubscriber_unsubscribedAt_idx"
  ON "NewsletterSubscriber"("unsubscribedAt");
