# URL-driven modal navigation

## Navigation contract

- Modal destinations remain normal React Router URLs and can be bookmarked or refreshed.
- Internal modal navigation uses the shared `ModalLink` component. It is a real React Router `Link`, so browser link behaviour (open in new tab, copy link, keyboard activation and modifier-click) is retained.
- The first background location is retained when navigating from one modal route to another. This prevents nested modal navigation from replacing the original screen underneath.
- The background route remains mounted while a modal route is active.
- Browser/Android Back returns through the modal history stack. Escape, backdrop click and the modal close action dismiss the active modal.
- A direct URL load or refresh has no in-memory background location and therefore renders as a standalone route.
- The application shell and selected bottom tab are derived from the background route while a modal is open.

## ModalLink usage

```tsx
<ModalLink to="/transactions/new">Add transaction</ModalLink>
<ModalLink to={`/transactions/${transaction.id}`}>View transaction</ModalLink>
<ModalLink to={`/transactions/${transaction.id}/edit`}>Edit transaction</ModalLink>
```

`ModalLink` accepts the standard React Router `Link` props, including `to`, `state`, `replace`, `relative`, `target`, `reloadDocument`, `preventScrollReset`, `className`, `aria-*`, and `onClick`.

## Modal destinations

- `/cards/new`, `/cards/:cardId`, `/cards/:cardId/edit`
- `/transactions/new`, `/transactions/:transactionId`, `/transactions/:transactionId/edit`
- `/payments/new`, `/payments/:paymentId`, `/payments/:paymentId/edit`

## Scope

This is a navigation and presentation change. Existing form components, API handlers, CRUD operations, validation, database schema and financial calculations are not intentionally changed.
