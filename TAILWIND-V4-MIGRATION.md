# Tailwind CSS v4 build integration

Tailwind CSS is now integrated through the official Vite plugin instead of the browser CDN.

## Changes

- Added `tailwindcss` and `@tailwindcss/vite` as development dependencies in `package.json`.
- Registered `tailwindcss()` in `vite.config.ts`.
- Added `@import "tailwindcss";` to `src/style.css`.
- Removed the `@tailwindcss/browser@4` script from `index.html`.

Tailwind utilities are now generated at build time and included in the production CSS bundle. No Tailwind browser runtime CDN is required.

## First install after extracting this source archive

The build environment used to prepare this archive could not reach the npm registry, so the existing `package-lock.json` could not be regenerated here. Run `npm install` once (not `npm ci`) to resolve the two new dependencies and update `package-lock.json`. Commit the updated lockfile. After that, use `npm ci` for reproducible installs.

Then run:

```bash
npm run typecheck
npm run build
```
