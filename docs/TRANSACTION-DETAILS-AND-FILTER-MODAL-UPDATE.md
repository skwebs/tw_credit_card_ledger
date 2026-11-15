# Transaction Details Routing and Filter Modal Update

## Transaction details presentation

The `ccm-transaction-details-mode` preference now applies to direct transaction detail URLs as well as in-app navigation:

- `modal` (default): row clicks, context-menu actions, direct URLs, refreshes, and new tabs display transaction details in a route modal. A direct URL without router background state uses the Transactions list as its background route.
- `context-aware`: transaction row clicks use a modal; context-menu View details and direct URLs use the full-page route.
- `full-page`: all transaction detail navigation uses the full-page route.

The synthetic background is limited to direct `/transactions/:id` routes in `modal` mode. Existing explicit React Router background state takes precedence.

## Transaction filters

The transaction filter panel is now a responsive modal dialog rather than a full-height right drawer. It is bottom-aligned on small screens and centered on larger screens. Existing filter fields, filtering behavior, clear/apply actions, and result count are unchanged. Outside click and Escape close the dialog.

## Validation

Run `npm ci`, `npm run typecheck`, and `npm run build` in the project environment. The supplied working environment did not contain complete Vite/Node type definitions, so a successful typecheck/build could not be established here.
