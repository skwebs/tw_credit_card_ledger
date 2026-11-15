# Route view extraction

## Extracted views

| View module | Route content |
|---|---|
| `src/pages/views/DashboardView.tsx` | Dashboard overview, budget summary, card summary, recent transactions |
| `src/pages/views/TransactionsView.tsx` | Transaction search, filters, grouped transaction list |
| `src/pages/views/CardView.tsx` | Selected card, billing cycle and statement content |
| `src/pages/views/PaymentsView.tsx` | Payment summary and payment list |
| `src/pages/views/SettingsView.tsx` | Budget, UPI apps, categories, density, and app settings |

## State ownership

`AppShell` remains the single owner of application state and data mutations. The extracted view components receive the state values and callbacks they need. This avoids duplicating calculations or moving API and offline behavior into page components as part of a bundle-only change.

The `AppRouteContext` shape and existing route wrapper components remain unchanged. A view is dynamically imported when its route content is rendered.

## Behavior-preservation constraints

Do not move or duplicate these responsibilities as part of visual refactoring:

- billing-cycle and settlement-date calculations;
- payment allocation and statement balance updates;
- optimistic transaction/payment/card mutations;
- local cache and outbox synchronization;
- route-modal background location handling;
- authentication and CSRF handling.
