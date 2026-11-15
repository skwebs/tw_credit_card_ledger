# Offline-first foundation — Phase 1

## Scope

This phase adds the durable IndexedDB schema and repository primitives only. It deliberately does **not** switch existing transaction, payment, card, UPI or settings mutations to the outbox yet. Those integrations are separate phases so that billing calculations and API behaviour are not changed prematurely.

## IndexedDB migration

Database: `card-ledger-private-cache`

- Version 1 `snapshots` store is retained.
- Version 2 adds `records`, `outbox`, and `sync_metadata`.
- Existing bootstrap snapshots are not deleted or rewritten by the upgrade.
- `clearBootstrapCache()` continues to clear only the bootstrap snapshot. It does not clear pending records, outbox operations, or sync metadata.

## Account isolation and logout

Every durable record and outbox operation is partitioned by `ownerId`. Repository reads and mutations require the authenticated account owner. This prevents one account from listing or replaying another account's pending operations on a shared browser profile.

Logout may clear the in-memory React state and authenticated bootstrap snapshot, but it must not clear `records` or `outbox`. After the same account signs in again, Phase 2+ can load that account's local records and resume its queue. A different account must never see or synchronize the previous account's pending operations.

The current application still uses its existing authentication/session rules. This phase does not allow unauthenticated server requests or bypass CSRF/session validation.

## Stores

### `records`

Key path: `[ownerId, entity, id]`

Indexes: `[ownerId, entity]`, `syncState`, `updatedAt`.

A record stores the locally visible entity payload, update timestamp, optional server version, and sync state (`pending`, `syncing`, `synced`, `failed`).

### `outbox`

Key path: `opId`.

Indexes: `status`, `createdAt`, `[ownerId, entity, entityId]`, `[ownerId, status]`, `[ownerId, createdAt]`.

Each operation contains a stable client-generated operation ID, account owner, entity, entity ID, action, payload, creation/update timestamps, retry count, next eligible retry time, dependencies, and last error.

`enqueueLocalMutation()` writes an optional local record and its outbox operation in a single IndexedDB read/write transaction. If either write fails, the transaction aborts; the app must not report the local save as successful.

### `sync_metadata`

Key path: `key`.

Stores future synchronization cursor/lease metadata without coupling the schema to a particular server sync implementation.

## Repository API

`frontend/src/data-cache.ts` exports:

- `putLocalRecord`
- `getLocalRecord`
- `listLocalRecords`
- `deleteLocalRecord`
- `enqueueLocalMutation`
- `listOutboxOperations`
- `updateOutboxOperation`
- `removeOutboxOperation`
- `getSyncMetadata`
- `setSyncMetadata`
- `getPendingOperationCount`

All record/outbox APIs are account-scoped. Callers must supply the authenticated account's stable owner ID; do not use a display name that can change. Never pass an owner ID supplied by untrusted UI input.

## Not yet implemented in Phase 1

- Migrating CRUD handlers to write local records/outbox operations.
- Outbox worker, connectivity triggers, retry/backoff and replay.
- Server idempotency keys and conflict/version endpoints.
- Attachment upload queue.
- Local record hydration into application state.
- Encryption-at-rest strategy and local retention controls.

These are intentionally deferred to later phases. Until those phases are implemented, existing online API mutation flows remain in use.
