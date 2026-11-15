# Optimistic Create/Update Behaviour (#8)

## Scope implemented
- Transactions: create and update apply to React state immediately, close the form immediately, then persist in the background. Failed requests roll back the optimistic list entry/update and show an error notification.
- Cards: create and update apply immediately to card/dashboard state, close the form immediately, then persist in the background. Failed requests restore the prior card/dashboard state.
- Payments: create and update apply immediately to payment state, close the form immediately, then persist in the background. Failed requests restore the prior payment state.

## Concurrency protection
- Duplicate submissions for the same record are guarded by an in-flight mutation key.
- These mutations no longer set the app-wide `busy` flag, so an API request does not disable unrelated application controls.
- Bootstrap refresh runs after server confirmation; refresh failure does not undo a server-confirmed mutation and is reported as a synchronization issue.

## Failure and retry policy
- Failed creates/updates are rolled back and surfaced through the global error toast.
- Automatic retry is deliberately not applied to POST creates: without server-supported idempotency keys, retrying after a lost response can create duplicate records.
- PUT updates are currently not automatically retried. A safe retry policy should be added only with explicit transient-error classification and server idempotency/conditional-update guarantees.
- Attachment upload remains a separate operation after transaction creation/update. An attachment failure is reported without incorrectly rolling back a transaction already saved by the API.

## Preserved contracts
No API endpoint, request payload, database schema, billing calculation, settlement-date calculation, or allocation algorithm was changed.
