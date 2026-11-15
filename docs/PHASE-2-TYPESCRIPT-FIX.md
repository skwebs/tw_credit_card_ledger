# Phase 2 TypeScript extraction fix

The extracted view modules previously accepted `Record<string, any>`. This erased the inferred element types of arrays and state setters, causing implicit-any diagnostics in JSX callbacks.

The view modules now retain a permissive index signature for the existing UI helper props while explicitly typing the data-bearing props that drive collection callbacks and state updates. Shared structural types live in `src/pages/views/view-types.ts`.

No application calculations, API calls, route definitions, or persistence behavior were changed as part of this correction. TypeScript strictness remains enabled.

Run `npm ci`, `npm run typecheck`, and `npm run build` after extracting this archive.
