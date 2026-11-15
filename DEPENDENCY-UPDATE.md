# Credit Card Manager — Dependency Update

## What changed
- Pinned every direct dependency in `package.json` to the exact version resolved in the supplied `package-lock.json`.
- Updated the lockfile root dependency specifications to match those exact pins.
- Preserved all 175 package-resolution entries, including transitive versions, registry URLs, and integrity hashes.
- No application source files, routes, UI, database code, or business logic were intentionally changed.

## Installation
Use the same commands in Termux (Node 24) and Windows (Node 26):

```bash
npm ci
npm ls --depth=0
npm audit
npm run build
npm run test:billing
```

`npm ci` uses the committed lockfile and does not rewrite it.

## Verification status
- ZIP integrity and JSON syntax: verified.
- Direct dependency pins match the package entries in the supplied lockfile: verified.
- Full npm install, audit, TypeScript build, and billing tests: not run in this environment.
