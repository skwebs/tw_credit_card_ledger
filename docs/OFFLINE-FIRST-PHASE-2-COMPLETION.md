# Offline-first Phase 2 — transaction CRUD completion

## Implemented in this package

- Transaction create, edit and delete are persisted to IndexedDB before the UI treats the change as saved.
- The local record and outbox operation are written in one IndexedDB transaction.
- The same queue path is used whether the browser currently reports online or offline. This also covers a connection that drops after a save begins.
- Queued transaction records are merged over the server bootstrap for the authenticated owner, including after reload/login. Pending deletes are hidden from the visible list until synchronized.
- Synchronization runs after login, on the `online` event, when the app becomes visible, and on a 15-second foreground retry check. Per-operation exponential backoff remains in force.
- Create retries reuse the durable outbox operation UUID as `client_mutation_id`; the API records the generated transaction ID in `transaction_mutations` in the same PostgreSQL transaction as the transaction insert.
- Update and delete remain replay-safe for the same operation sequence. Locked-statement and validation errors remain queued rather than discarding local data.
- Pending operations and local records remain scoped to the numeric authenticated user ID. Logout clears the bootstrap snapshot only.
- Existing settlement date, billing cycle, statement lock and payment allocation algorithms are not intentionally changed.

## Migration runner correction

- `npm run db:migrate` is a true read-only dry run. It does not create `schema_migrations` or execute SQL.
- `npm run db:migrate:apply` applies pending migrations.
- Duplicate numeric migration prefixes are rejected rather than silently skipping a file.
- Existing production history values such as `001` through `005` are recognized as legacy-applied versions. New applied rows use the complete migration filename.
- The apply path uses a PostgreSQL advisory lock to prevent concurrent migration runs.

The user's Vercel database already reports migration history through `005` and the `transaction_mutations` table. With that legacy history, a dry run should report no pending migrations. Do not run the apply command unless the dry run shows a migration you have reviewed and intended to apply.

## Known limitations

- This phase covers transaction CRUD only. Payments, cards, UPI apps, settings and receipt-file uploads are not offline-enabled.
- Editing or deleting a temporary negative-ID transaction before its create operation synchronizes is intentionally blocked.
- Receipt files are not persisted in the outbox. The transaction is saved locally, but the receipt must be attached after synchronization.
- Authentication still requires a reachable server. Pending local data survives logout and resumes after the same account signs in again.
- IndexedDB is not encrypted at rest. Use a device lock and avoid shared browser profiles.

## Verification

- `node --check scripts/migrate-db.mjs`: passed.
- Strict standalone TypeScript check for `frontend/src/data-cache.ts`: passed.
- Full frontend/API build: not run because dependency installation did not complete in this environment. The package has no lockfile, and `npm install --ignore-scripts --no-audit --no-fund` timed out.
- No live Vercel database operation was performed while preparing this package.
- Browser IndexedDB integration and real online/offline end-to-end tests remain to be run in the user's browser environment.
