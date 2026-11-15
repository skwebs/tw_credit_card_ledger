# Bundle optimization

## Changes in this pass

- Kept React Router route-level lazy loading and its existing `Suspense` boundaries.
- Extracted the Dashboard, Transactions, Card detail, Payments, and Settings view JSX from `src/App.tsx` into independent modules under `src/pages/views/`.
- Each view is loaded with `React.lazy()` only when its corresponding route content is rendered.
- The existing `AppRouteContext` contract remains unchanged. `AppShell` continues to own shared state, API operations, optimistic mutations, offline synchronization, and modal navigation; the extracted views receive the required state and callbacks as props.
- Preserved the existing route components, route URLs, and modal/background-location behavior.
- Corrected the escaped utility selectors in `src/style.css` so LightningCSS can parse the literal Tailwind class selectors during minification.
- Kept Vite's 500 kB chunk warning enabled. No warning threshold was raised to hide the oversized chunk.

## Architecture boundary

This is a presentation extraction, not a rewrite of business logic. Shared state and data mutations deliberately remain in `AppShell` so transaction settlement dates, billing-cycle calculations, payment allocation, offline mutation handling, and existing API behavior are not duplicated across page components.

The five extracted page views are asynchronous modules. Shared application state remains in the application shell and is passed to each view through a narrow per-view props object. The existing route-context provider still exposes the page elements to the existing route wrappers.

## Verify locally

Run from the project root:

```bash
npm ci
npm run typecheck
npm run build
```

Inspect generated chunks:

```bash
du -ah dist/assets | sort -rh | head -30
```

Expected: separate `DashboardView`, `TransactionsView`, `CardView`, `PaymentsView`, and `SettingsView` chunks should appear. Their contents are loaded on demand. The main chunk can still contain shared application state, API/offline logic, form implementations, and common components; do not expect the main chunk to become empty.

## Follow-up optimization

If the main chunk remains above 500 kB, inspect its composition before further refactoring. The next candidates are the shared form implementations and heavy optional features (for example attachment/image processing or export libraries), but they should only be split after confirming their import graph and behavior.
