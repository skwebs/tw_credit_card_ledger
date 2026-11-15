# Offline-first Phase 2 — Transaction mutations

## Included

- Transaction create, update and delete can be committed to the browser's IndexedDB outbox while the browser is offline.
- The local transaction state is updated optimistically; the form closes after the durable IndexedDB write succeeds.
- The queue is scoped to the authenticated numeric user ID. Logout clears only the bootstrap snapshot; pending transaction records and outbox entries remain.
- Pending operations are replayed after the same account signs in again and when connectivity returns / the app becomes visible.
- Create requests carry a stable operation UUID. The API persists the resulting transaction ID in `transaction_mutations` in the same PostgreSQL transaction as the create. Replaying the same UUID returns the original ID instead of inserting a duplicate.
- Transaction PUT is replay-safe for the same payload. Transaction DELETE now treats an already-missing row as a successful replay. Existing locked-statement validation remains in place.
- Transient sync errors use exponential backoff. Validation / locked-cycle errors remain in the outbox with their last error and are retried with backoff, so the user can resolve the underlying condition (for example, unlock a statement) without losing the queued change.

## Required deployment step

Apply the database migrations before deploying the API/frontend build. First run the dry-run command:

```bash
npm run db:migrate
```

This command only lists pending migrations and makes no database changes. After verifying `DATABASE_URL`, taking a restorable backup, and reviewing the plan, apply them explicitly:

```bash
npm run db:migrate:apply
```

The idempotency ledger is created by `db/migrations/005_transaction_idempotency.sql`. Do not deploy the API before that migration has completed; queued create requests require the `transaction_mutations` table. See `docs/PRODUCTION-MIGRATION-SAFETY.md` for production precautions.

## Important scope and limitations

- This phase covers transaction CRUD only. Cards, payments, UPI apps, settings and receipt-file uploads are not offline-enabled.
- A transaction created offline can be edited after it has synchronized. Editing a temporary negative-ID transaction before it synchronizes is intentionally blocked to avoid ambiguous create/update ordering.
- A receipt selected while offline is not queued. The transaction is saved, and the UI informs the user that the attachment must be added after synchronization.
- Login still requires a reachable server. Pending data survives logout, and resumes after the account is authenticated again.
- Existing billing-cycle, settlement-date, statement-lock, payment-allocation and server validation logic has not been redesigned.
- The browser IndexedDB queue is durable for normal browser restarts, but it is not encrypted at rest. Use a device-level lock and do not use shared browser profiles for sensitive financial records.

## Verification status

- Database migration SQL and API paths were reviewed for idempotent create replay and idempotent delete replay.
- Full frontend/API build was not verified in this environment because dependency installation did not complete; this checkout has no lockfile, so `npm ci` cannot run. `npm install --ignore-scripts` timed out.
- No live database migration, browser IndexedDB integration test, offline/online end-to-end test, or receipt upload test was run here.
