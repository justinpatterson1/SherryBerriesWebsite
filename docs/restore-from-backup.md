# Restoring the database from a backup

Nightly dumps are written to the private R2 backup bucket by
[`.github/workflows/database-backup.yml`](../.github/workflows/database-backup.yml)
at 04:00 Trinidad time, under `daily/YYYY-MM-DD.dump`, and kept for 30 days.

**Read this before you need it.** Neon's history retention on this plan is six
hours, so by the time most problems are noticed these dumps are the only copy
left. Working out the procedure while the store is down is the wrong time.

---

## Before anything else

**Do not restore over the live database as a first move.** Restore into a
throwaway Neon *branch*, confirm the data is what you expect, and only then
decide how to get it into production. A restore that turns out to be the wrong
day, run straight over the live database, turns one problem into two.

## What you need

- The R2 backup bucket credentials (the same four values held as GitHub
  secrets: account id, access key id, secret access key, bucket name).
- `psql` and `pg_restore`, version 17 or newer.
- A Neon connection string for the target — **unpooled** (no `-pooler` in the
  host) for the same reason the backup uses one.

## 1. Find and fetch the dump

```bash
export AWS_ACCESS_KEY_ID=...            # R2 backup token
export AWS_SECRET_ACCESS_KEY=...
export AWS_DEFAULT_REGION=auto
export AWS_REQUEST_CHECKSUM_CALCULATION=when_required
export AWS_RESPONSE_CHECKSUM_VALIDATION=when_required
ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
BUCKET=<backup-bucket>

# What is available
aws s3 ls "s3://$BUCKET/daily/" --endpoint-url "$ENDPOINT"

# Pull the one you want
aws s3 cp "s3://$BUCKET/daily/2026-09-14.dump" ./restore.dump --endpoint-url "$ENDPOINT"
```

Pick the **last dump taken before the damage**, not simply the newest. If a bad
bulk edit ran on the 13th and was noticed on the 15th, the 15th's backup
faithfully contains the damage.

## 2. Look inside it before restoring

```bash
pg_restore --list restore.dump | head -40
```

This is also how you confirm the file downloaded intact.

## 3. Restore into a scratch Neon branch

In the Neon console, create a branch from production (name it something
obvious, e.g. `restore-check`), and copy its **unpooled** connection string.

```bash
pg_restore --no-owner --no-acl --clean --if-exists \
  --dbname "postgres://...restore-check...neon.tech/neondb?sslmode=require" \
  restore.dump
```

`--clean --if-exists` drops the branch's existing objects first, so you get the
dump's contents rather than a merge of two states.

Then check it is what you think it is:

```bash
psql "$BRANCH_URL" -c 'select count(*) from "Order";'
psql "$BRANCH_URL" -c 'select max("createdAt") from "Order";'
psql "$BRANCH_URL" -c 'select count(*) from "User";'
```

The newest order timestamp tells you exactly how much you are about to lose:
everything after it was written to production after this dump was taken.

## 4. Decide how to get the data into production

Two situations, two very different answers.

**A few rows were damaged** (the common case — a bad edit, one deleted
product). Do **not** restore the whole database. Copy just what you need out of
the scratch branch and apply it to production with a targeted `UPDATE`/`INSERT`.
Everything that happened since the dump — orders, signups, receipts — stays.

For a single table, `pg_restore` can extract just that one:

```bash
pg_restore --no-owner --no-acl --data-only --table=Product \
  --dbname "$SOME_SCRATCH_URL" restore.dump
```

**The whole database is gone or corrupt.** Restore the dump into a fresh branch,
verify as above, then promote that branch to primary in the Neon console. That
is a shorter outage and a smaller blast radius than restoring over the live
database in place.

Either way: everything written after the dump's timestamp is lost. Before
promoting, write down what that covers — orders placed overnight are real
customers who paid real money, and they will need contacting.

## 5. After a real restore

- Check recent orders in the admin, and reconcile against WiPay's dashboard and
  the store's bank account for anything paid after the dump.
- Trigger the backup workflow manually (**Actions → Database backup → Run
  workflow**) so the newest backup reflects the restored state.
- Note what happened in `context/open-issues.md` if it exposed a gap.

---

## Practising it

Do step 1 through 3 once, now, while nothing is wrong. It takes about fifteen
minutes and it is the only way to know the dumps are restorable. Delete the
scratch branch afterwards. A backup nobody has ever restored is a guess.
