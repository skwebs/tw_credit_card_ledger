# Screenshot review updates

This update applies the visual and navigation decisions confirmed during the screenshot review.

## Navigation
- Card-specific transaction history (`/cards/:cardId`) is a normal application page.
- Card create/edit, transaction create/edit/details, and payment create/edit/details remain URL-driven modal destinations.
- CRUD modals present as bottom sheets on mobile and centered dialogs on desktop.

## Modal presentation
- Transaction and payment detail headers use a left-aligned title and right-aligned close control.
- Transaction detail actions remain in a bottom action row, with Delete on the left and Edit on the right.
- The route modal shell clips overflow rather than introducing a generic modal scrollbar; content is sized to fit where the form layout permits.
- Transaction entry controls share a consistent 64px target height and a consistent vertical rhythm.
- Focused composite transaction fields receive a purple border in both themes.

## Theme corrections
- The light-theme Delete action uses a readable destructive red treatment. Dark-theme styling is unchanged.
- Budget status text uses stronger light-theme semantic colours while retaining the existing dark-theme palette.

No API, database, validation, calculation, or CRUD business logic was intentionally changed.

## Screenshot references #1–#6

### #1 — Transactions sticky search
- The search/filter strip begins immediately below the app header on the Transactions page.
- Header and search heights are measured at runtime and used for sticky offsets, including grouped month headings.
- The sticky search and month surfaces are opaque in both themes so scrolling transaction rows cannot show through.
- Card-specific transaction search uses the same measured sticky offset but retains its preceding card-summary spacing.

### #2 — Add Expense modal
- Header horizontal/vertical geometry now matches the More options modal header.
- The footer no longer paints a separate background strip or shadow behind Cancel/Save.
- Both action buttons have a slightly taller, equal touch target.
- Form controls retain the shared 64px height; standard form gaps and the nested card/payment selector gaps use a consistent 12px rhythm.

### #3 — Transaction Details modal
- Main summary and detail rows remain edge-to-edge within the modal.
- Only the bottom Delete/Edit action row receives horizontal inset.

### #4 — Card statement and billing-cycle semantic colours
- Light theme uses readable semantic treatments for Unpaid/Paid/Partially paid status badges.
- Bank-statement match and difference notices use light-theme semantic surfaces and foreground colours.
- The Active billing-cycle label uses a stronger light-theme purple.
- Dark-theme colours are not overridden.

### #5 — Recent Transactions action
- View all uses a stronger purple in light theme; dark-theme colour remains unchanged.

### #6 — Transaction date badge
- Light-theme date text is softened slightly to `#273449` while preserving badge size, background, and dark-theme appearance.

All changes are presentation-only. Existing transaction calculations, billing-cycle rules, statement operations, validation, API calls, persistence, and CRUD handlers are retained.


## Follow-up corrections after mobile screenshot recheck

- **#1B:** Made the application header an opaque, isolated sticky surface in both themes and raised its stacking layer above the sticky search and month headings. The search strip remains opaque and above scrolling transaction content.
- **#2A:** Explicitly restored the Add Expense header bottom divider with theme-aware border colour, retaining title-left / close-right alignment.
- **#2C:** Converted the card/payment selector group to an explicit vertical flex gap of 12px and neutralized competing `space-y` margins.
- **#3 (corrected interpretation):** Added a shared horizontal inset to the transaction amount summary and detail rows, matching the Delete/Edit footer inset; the header remains unchanged.

No transaction, payment, billing, settlement, persistence, API, or validation logic was changed for these follow-up corrections.
