# Card Ledger — React + TypeScript UI, Node API, Neon PostgreSQL

This is the migration build of the existing Card Ledger / Credit Card Manager. The original React screen components and styles are retained as the UI baseline. The server-side API is being moved from PHP/SQLite to a Vercel Node function backed by Neon PostgreSQL. The existing live SQLite database is not included or modified.

## Existing functionality retained in the baseline

- Responsive dark UI, dashboard, Transactions, Settings, Card details, Payments, and bottom navigation.
- Persistent IndexedDB bootstrap cache for instant stale-data display, followed by background server revalidation.
- Optimistic transaction create/edit/delete, card create/edit, and payment-history create/delete with rollback on API failure and a non-blocking sync status.
- First-run account setup, login/logout, CSRF token, remembered login, and server-side login throttling.
- Credit card create/edit/archive, bank, last four digits, credit limit, billing day/rule, and due days.
- Transaction create/edit/delete, integer-paise amounts, transaction timestamp, settlement date, UPI/online/swipe methods, UPI app snapshot, category, tags, notes, and optional receipt attachment.
- Calendar-month transaction history, date and settlement-date filters, search, card-specific billing cycles, and newest-first order.
- Automatic statement reconciliation, bank-amount confirmation, statement lock/unlock, bill payments, partial allocations, and unallocated advance credit.
- Editable UPI apps/categories, monthly budget, PWA shell, and private authenticated receipt access.

**Migration status:** this is an implementation build, not yet production-approved. It must be connected to a test Neon database and exercised against real export counts before cutover. No change to the visible UI is intended. Keep the current SQLite deployment intact until you approve the verified replacement.

## Stack

- React + TypeScript + Vite frontend; Tailwind CSS v4 browser CDN retained to preserve the current visual system.
- TypeScript serverless API under `api/`.
- Neon PostgreSQL, using server-only `DATABASE_URL`.
- Optional private Cloudflare R2 bucket for receipt images.
- Vercel deployment at the domain root (for example, `https://cred.isatish.in/`).

## 1. Configure a test environment

1. Install Node.js 20 or newer.
2. Copy `.env.example` to `.env.local`.
3. Create a **separate test project** in Neon and replace `DATABASE_URL` with its connection string. Never put this value in a `VITE_` variable.
4. Replace `SESSION_SECRET` with a long random secret (at least 32 characters). The example value is not a production secret.
5. Leave the R2 values empty until you create a private bucket and credentials. Receipt upload/viewing requires R2 to be configured.
6. Install dependencies with `npm install`.
7. Apply schema migrations using `npm run db:migrate`.
8. Run locally with `npx vercel dev` so Vercel's `/api` function is available along with the frontend.

The `.env.example` file contains demonstration placeholders only. It is not a working connection configuration. Do not commit `.env.local`, `.env`, a real connection string, secret, or R2 credentials.

## 2. Database migrations

Numbered SQL files in `db/migrations/` are applied in order and recorded in `schema_migrations`. They create the initial schema and add indexes, receipt keys, server-side sessions, and login throttling. Running migrations again is safe; already-recorded migration versions are skipped.

Money is stored as integer paise. Transaction and payment times are kept as local wall-clock timestamps (the application timezone defaults to `Asia/Kolkata`); settlement and cycle boundaries are date-only values. The backend is the authoritative source for cycle assignment.

## 3. Export SQLite data

Make a read-only backup of the live SQLite database and the complete `storage/attachments/` directory before exporting. Do not point the importer at production until you have reviewed the export.

```bash
python scripts/export-sqlite.py /path/to/storage/app.sqlite sqlite-export.json
```

On Windows PowerShell, use the corresponding full path, for example:

```powershell
python scripts/export-sqlite.py "C:\path\to\app.sqlite" sqlite-export.json
```

The export includes table rows, IDs, relationships, timestamps, statement confirmations/locks, and payment allocations. It does not contain the binary receipt images. Keep `sqlite-export.json` private because it contains account and financial records, including the password hash.

## 4. Import into an empty Neon database

**The importer refuses to run if any target business table already contains rows.** Use a fresh test Neon database for the first import; do not import over an existing dataset.

```bash
npm run db:import:neon -- sqlite-export.json
```

After importing, compare row counts and the printed transaction/payment/allocation totals with the SQLite export. Then sign in with the existing account password (the importer supports the legacy PHP bcrypt hash) and verify card settings, transactions, statements, payments, and categories.

If there are receipt attachments and you have configured R2, migrate them after the database import:

```bash
node scripts/migrate-receipts.mjs sqlite-export.json /path/to/legacy/storage
```

The storage path is the directory that contains the `attachments/` folder. On shared hosting, download that folder first. The receipt migrator reports missing files and fails rather than silently claiming they were migrated.

## 5. Build and deploy

```bash
npm run build
```

Deploy the project to Vercel and add `DATABASE_URL`, `SESSION_SECRET`, and (if using receipts) the R2 variables under Project Settings → Environment Variables. Run the numbered SQL migrations against the intended Neon database before testing the deployment.

`vite.config.ts` uses `/` as the production base because this deployment serves from the domain root. `vercel.json` keeps the API function configuration and relies on Vercel file-system routing for `/api`. The PWA manifest and service worker are also configured for root scope. Verify the generated routes in a Vercel preview before promoting the deployment.

## 6. Pre-cutover checklist

- [ ] Frontend build and Vercel preview succeed.
- [ ] Setup/login/logout, CSRF rejection, remembered login, and throttling behave correctly.
- [ ] Card CRUD/archive and inactive UPI-app historical references behave correctly.
- [ ] Cycle boundary tests pass for both billing rules and month-end/leap-year dates.
- [ ] Transaction totals and calendar-month results match SQLite.
- [ ] Statement totals, bank-confirmed amounts, locks, payment allocations, and outstanding dues match SQLite.
- [ ] Partial payments, overpayments, payments made before a statement exists, and later statement generation are tested.
- [ ] Receipt images are migrated and remain private behind authenticated API access.
- [ ] PWA does not cache API responses or receipt data.
- [ ] A second independent verification of row counts and rupee totals is complete.
- [ ] You explicitly approve the cutover.

Until every relevant check is complete, retain the original app, SQLite database, and receipt directory as the rollback copy. Never use a production database or real credentials for development tests.

## Project layout

```text
api/index.ts                    Vercel API: auth, CRUD, statements, payments, receipts
api/billing.js                  Canonical billing-cycle rules
frontend/src/App.tsx            Existing React UI (preserved)
frontend/src/style.css          Existing visual refinements (preserved)
db/migrations/                  Versioned PostgreSQL schema
scripts/export-sqlite.py        Read-only SQLite export
scripts/import-neon.mjs         Guarded import into an empty Neon database
scripts/migrate-receipts.mjs    Private R2 receipt migration
scripts/test-billing.mjs        Billing-cycle boundary tests
vercel.json                     Function and subpath routing
.env.example                    Demo-only environment template
```


## Local cache and synchronization

The frontend stores the last authenticated bootstrap snapshot in browser IndexedDB and shows it before background session validation/revalidation completes. It refreshes on reconnect and when returning to a visible tab. Transaction create/edit/delete updates the UI immediately and rolls back that transaction if the API rejects the change. The API and NeonDB remain authoritative; a successful write is followed by a bootstrap refresh.

The local snapshot contains financial records and is not encrypted by the browser. Use this only on a trusted device/profile, keep the device lock enabled, and log out when sharing the device. Logout and an unauthenticated session response clear the cached snapshot. Browser storage may be cleared by the user or browser at any time. This is not a durable offline write queue: failed mutations are rolled back rather than silently queued.

## React Router v7 navigation

The application uses `react-router-dom` v7. The browser URL is now the source
of truth for the active top-level screen:

- `/dashboard`
- `/transactions`
- `/payments`
- `/settings`
- `/cards/:cardId`

`AppShell` remains mounted across route changes so shared application data,
offline cache state, and existing modal state are not discarded. Its active
screen is derived from `useLocation()` rather than a separate `tab` state.
Navigation controls use `useNavigate()`.

On pathname changes, the document scroll position is reset to the top. This
ensures the sticky application header is at the top and the selected bank card
content begins below it, including when opening cards other than the first card.

The old custom `popstate` guard was removed because it intercepted browser
history navigation. React Router now handles Back/Forward navigation.

For production hosting, configure the server to serve `index.html` for
application routes (SPA fallback), while excluding API routes and static assets.


## React Router v7 route-component refactor

The application uses a nested route tree with `AppShell` as the persistent layout route and an `<Outlet />` for page content. CRUD forms are URL-addressable so they can be refreshed, bookmarked, and navigated with browser Back/Forward while retaining the existing form UI and mutation logic.

Implemented routes:
- `/dashboard`
- `/cards` (card management in Settings)
- `/cards/new`
- `/cards/:cardId` (card detail)
- `/cards/:cardId/edit`
- `/transactions`
- `/transactions/new`
- `/transactions/:transactionId` (transaction detail)
- `/transactions/:transactionId/edit`
- `/payments`
- `/payments/new`
- `/payments/:paymentId` (payment detail)
- `/payments/:paymentId/edit`
- `/upi-apps/new`
- `/upi-apps/:appId/edit`
- `/settings`

Create and edit routes reuse the existing validated forms and save handlers. Payment editing now has a corresponding `PUT /api?action=payments` operation; it updates the payment and recalculates allocations, including rebalancing the previous card if the payment is moved to another card. Delete remains a confirmed action rather than a separate page. Card deletion follows the existing API policy: records with history are archived, otherwise permanently deleted. UPI application deletion remains a confirmed deactivation action.

The shared shell retains authentication, bootstrap data, sync state, navigation, header, and global overlays across route changes. Direct transaction and payment detail URLs resolve from loaded data. Route changes reset the document and main-content scroll position; card ID changes also trigger the reset.

### Validation note

The source ZIP was checked for archive integrity. TypeScript parsing was run against `frontend/src/App.tsx`; no JSX/parser errors were reported. A complete dependency-backed TypeScript/build run could not be completed in this environment because dependencies were not installed and package installation did not complete. Run `npm install` followed by `npm run build` in the project root before deployment.

## Monthly Overview automatic selection

The dashboard now chooses the second Monthly Overview from the latest bill-availability date across active cards, rather than checking whether statements have been generated. Cards using `billing_rule: start` are treated as available on the configured billing day; cards using `billing_rule: end` are treated as available on the following day. The date is clamped to the actual month length (for example, billing day 31 in February resolves to February's final day).

Manual carousel selection is preserved for the current dashboard visit. The automatic selection is reapplied when the dashboard is entered/reloaded or when the active-card billing schedule changes. Statement generation status remains independent from overview selection.

## Route-based CRUD implementation (November 2026)

The frontend now uses dedicated React Router route components under `frontend/src/pages/` for the main pages and CRUD workflows. The authenticated application shell remains persistent and renders nested routes through React Router's `Outlet`.

### Route map

| Workflow | Route |
|---|---|
| Dashboard | `/dashboard` |
| Card collection | `/cards` |
| Create card | `/cards/new` |
| Card details | `/cards/:cardId` |
| Edit card | `/cards/:cardId/edit` |
| Transaction collection | `/transactions` |
| Create transaction | `/transactions/new` |
| Transaction details | `/transactions/:transactionId` |
| Edit transaction | `/transactions/:transactionId/edit` |
| Payment collection | `/payments` |
| Record payment | `/payments/new` |
| Payment details | `/payments/:paymentId` |
| Edit payment | `/payments/:paymentId/edit` |
| Add UPI application | `/upi-apps/new` |
| UPI application details | `/upi-apps/:appId` |
| Edit UPI application | `/upi-apps/:appId/edit` |
| Settings | `/settings` |

Create/edit forms for cards, transactions and payments render as route content rather than modal overlays. Card, transaction, payment and UPI application details are standalone routes. Small pickers and confirmations inside forms remain overlays. Delete remains a confirmed action, not a page. UPI application create/edit use dedicated route forms.

The route components and CRUD route screens are separated into files. The shared screen view-model construction and the dashboard/transaction/card-detail/payment/settings collection markup are still owned by `AppShell` in `App.tsx`. This is an incremental extraction: business logic, API calls, offline cache and optimistic updates remain centralized to avoid changing existing data behavior. Further extraction of the collection-page JSX and service/state modules is still possible without changing the route contract.

### Validation note

The archive has been checked for ZIP integrity and source-level route coverage. A full dependency-backed TypeScript/Vite production build and browser regression pass could not be completed in this environment because dependency installation did not finish. Before deployment, verify direct URL refresh, Back/Forward, card switching, all create/edit/delete flows, payment allocation recalculation, offline recovery, and mobile/desktop layouts against the production database. Vercel route rewrites and the public Apache `.htaccess` fallback were added for SPA deep links; confirm the hosting platform serves these rules as expected.
