# Migration notes: Credit Card Ledger 2.0.0

## Project migration
- Application source migrated from `frontend/src` to `src`.
- Existing API, database migrations, scripts, PWA assets, and project documentation are retained.
- The new project's dependency versions and `package-lock.json` are retained.
- Vite is configured for root deployment (`base: '/'`).
- Build now type-checks the frontend and API before running the Vite production build.

## Important
- `.env` was intentionally not copied. Create it from `.env.example` and add your deployment-specific secrets.
- Do not run database migrations against production until you have a verified backup.
- The uploaded starter project's generated `dist` folder and template demo assets were excluded.
- `App-original.tsx` and `App.tsx.WorkingOld` were excluded; the active `App.tsx` was migrated.

## Install and verify
```bash
npm ci
npm run typecheck
npm run build
npm run dev
```

If the build reports TypeScript or React 19 compatibility issues, fix those individually without replacing the new project's package versions or reverting application behavior.
