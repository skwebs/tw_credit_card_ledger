# Transaction context menu

Transaction rows expose one shared action menu on the Dashboard, Transactions page, and Card details page.

## Open the menu

- Desktop: right-click a transaction row.
- Touch devices: press and hold a transaction row for approximately 520 ms.
- Any device: use the row's three-dot action control.

## Actions

- View details: opens the transaction details route.
- Edit transaction: opens the existing transaction edit route.
- Copy details: copies the transaction's main identifying fields to the clipboard.
- Delete transaction: asks for confirmation, removes the transaction from the local view, and queues the deletion through the existing transaction outbox. When online, background synchronization starts immediately; when offline, the deletion remains queued for the next synchronization.

The menu closes on outside interaction or Escape. It is rendered in a portal so transaction-list containers with overflow clipping do not cut it off. Reduced-motion preferences disable the menu entrance animation.

## Scope

The shared row component is used on the Dashboard, Transactions page, and Card details page, so all three surfaces receive the same menu and behavior. Other entities do not receive context menus in this change.
