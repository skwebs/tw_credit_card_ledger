# Production database migration safety

## Safe command sequence

1. Confirm `DATABASE_URL` points to the intended database. The migration tool prints only the database host, never credentials.
2. Take a fresh database backup and verify that it can be restored.
3. Run `npm run db:migrate`. This is a **dry run**: it lists pending migrations and does not create tables or modify data.
4. Review the listed migration files and compare the target schema with the expected schema.
5. Only after backup and review, run `npm run db:migrate:apply` to apply pending migrations.

## Migration identifiers and legacy history

Migration versions are the complete filename without `.sql`, for example `002_attachment_key` and `005_transaction_idempotency`. This avoids the former collision where two files shared numeric version `002`.

The previous runner recorded only numeric prefixes (`001`, `002`, etc.). These legacy rows are retained. They are not treated as proof that every file sharing that prefix was applied. The current SQL files use additive/idempotent DDL (`CREATE ... IF NOT EXISTS`, `ADD COLUMN IF NOT EXISTS`) so the canonical migrations can establish their own full-name history. Review any customized production schema before applying.

## Current ordered migrations

- `001_initial.sql` — creates baseline tables/indexes if absent.
- `002_attachment_key.sql` — adds `transactions.attachment_key` if absent and ensures selected indexes exist.
- `003_auth_sessions.sql` — creates authentication session storage if absent.
- `004_login_throttle.sql` — creates login-throttle storage if absent.
- `005_transaction_idempotency.sql` — creates the transaction idempotency ledger and index if absent.

Each file runs in its own PostgreSQL transaction. A failure rolls back that migration and stops the sequence. A PostgreSQL advisory lock prevents two copies of this migration runner from applying concurrently.

## Data-preservation notes

These migrations do not contain `DELETE`, `TRUNCATE`, `DROP`, or updates to existing financial rows. `001_initial.sql` uses `CREATE TABLE/INDEX IF NOT EXISTS`; `002_attachment_key.sql` adds a column with a default; the remaining migrations create new tables/indexes. PostgreSQL may take brief locks while adding a column or creating indexes. Test on a restored production backup first, especially if the transactions table is large or the production schema has been customized.

The migration tool does not create a backup and cannot verify that a backup is restorable. Do not run apply mode without a verified backup and a reviewed dry-run against the intended database.
