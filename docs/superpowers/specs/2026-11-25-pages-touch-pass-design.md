# Pages touch and polish pass (all review items)

## Goal

Implement all 23 suggestions from the Impeccable page review (`.impeccable/mocks/pages-review.html`) for every page except the editor: make every action reachable on iPad/touch, fix the menu-overflow and 429 bugs, and remove the listed accessibility and consistency issues.

## Scope

Dashboard and `/collections`, sidebar/layout, Settings, Profile, Admin, and the auth pages (login, register, reset, reset-confirm, auth-setup, auth status error panel). Item IDs follow the review page:

- **Dashboard:** D1 ⋯ button on cards; D2 selection circle on touch; D3 denser grid; D4 menus clamped to viewport; D5 phone toolbar in 2 rows; D6 collection chip touch target; D7 button group and ⌘K on touch.
- **Sidebar:** S1 ⋯ on collections and 44 px "+"; S2 Trash in Library and active account page; S3 44 px rows and no resize handle on touch; S4 label contrast.
- **Profile, Settings, Admin:** P1 neutral "Change password"; P2 readable avatar initials; ST1 whole settings row tappable with a bigger switch; ST2 language entry shows a name; A1 user cards on phone; A2 status switch with confirm, no self-impersonation; A3 distinct reset labels.
- **Auth and errors:** G1 429 vs. network error; AU1 auth-setup in auth style; AU2 visible labels and 16 px inputs on touch; AU3 reset help wraps and has a copy button; AU4 no duplicate text on auth-setup.

## Non-goals

- Editor (`/editor/:id`, `/shared/:id`).
- Backend changes.
- New layouts beyond the mocks.
- The tablet/desktop dashboard toolbar from `1111d7c`: D5 only changes widths below `md`.
- The `border-l-4` detector hits (`ApiKeysCard.tsx`, `HistoryPanel.tsx`).

## Decisions (2026-11-25, see `DECISIONS.md`)

- All 23 items approved. The mocks on the review page count as the chosen variants.
- New UI text is English, matching the app. Sidebar strings go through `i18n.ts`, with zh-CN translations.
- ST2: the extra language entry shows the language name (`Intl.DisplayNames`) plus "editor only" instead of a locale code.
- D6: the collection chip stays a picker. On `(hover: none)` its hit area grows to 44 px; its look stays the same.
- S2 deviates from upstream's compact sidebar on purpose: Trash is always in Library.
- Touch means `@media (hover: none)`. Desktop with a mouse keeps today's look unless an item says otherwise.

## Acceptance criteria

1. **D1:** iPad (touch) shows a ⋯ button on every card with a 44 px hit area. A tap opens the card menu anchored at the button. "Move to…" expands inline on tap. Rename, Move, Duplicate, Export and Delete all work from it. Desktop right-click and double-click still work.
2. **D2:** On touch the selection circle is visible without hover, has a 44 px hit area and selects the card on tap.
3. **D3:** iPad landscape (1194×834) shows 3 columns, desktop 1440 shows 4, phone shows 1.
4. **D4:** A right-click on the rightmost card at 1440 px keeps the menu and submenu inside the viewport. The sidebar menu is clamped too.
5. **D5:** Phone at 390 px with nothing selected shows the toolbar in 2 rows, and the first card starts at least about 100 px higher than before (369 px). Selecting a card shows the selection row.
6. **D6, D7:** On touch, the chip hit area is ≥ 44 px high, button-group items are 40 px (the group is 44 px) and the ⌘K hint is hidden.
7. **S1:** On touch every collection row has a ⋯ button that opens rename, share and delete. "+" is 44 px with full opacity. On desktop ⋯ shows on hover and focus.
8. **S2:** Trash is a Library row (drop target, active state). On Settings, Profile and Admin the account button is highlighted and names the page.
9. **S3, S4:** Sidebar rows are 44 px on touch, the resize handle is hidden on touch, and the section labels reach ≥ 4.5:1 contrast.
10. **P1, P2:** "Change password" is a secondary button. Avatar initials are dark on amber (≥ 4.5:1).
11. **ST1, ST2:** Tapping a settings row title toggles its switch. The switch is 52×30 on touch. The extra language entry reads e.g. "Deutsch (editor only)".
12. **A1, A2, A3:**
    - Below `xl` the users list renders as cards without horizontal scroll (was `md`; changed in review round 1, see `DECISIONS.md`).
    - The status is a switch, and deactivating asks for confirmation through `ConfirmModal`.
    - "Must change password" is a labeled switch.
    - Impersonate is disabled for the current user.
    - The reset buttons read "Unlock" (rate limit) and "Temporary password" (users).
13. **G1:** A 429 from `/auth/status` shows "Too many requests" with a retry. A network failure keeps the operator hint. The panel uses the app style.
14. **AU1–AU4:**
    - Auth-setup uses `.auth-page`, `.auth-heading` and `.auth-panel`, and the duplicate box is removed.
    - Login and register show visible labels.
    - On touch, `.ui-input` is 16 px with a 44 px height.
    - The reset help command wraps and has a copy button.
15. **Light and dark:** both correct on every changed page.
16. **Checks:** frontend unit tests, lint and typecheck are green, and the existing e2e specs that touch these pages pass.

## Error cases

- **Card menu near the screen edge, or a small screen:** the clamp keeps the menu at least 8 px inside the viewport.
- **No collections:** "Move to…" shows only "Unorganized".
- **429 with a `Retry-After` header:** the message uses its value in seconds. Without the header it says "in a minute".
- **Admin deactivates themselves:** stays disabled, as today.

## Constraints

- Fork divergence: keep changes small and in existing components.
- Shared touch rules live in `frontend/src/index.css` (`@media (hover: none)` block).
- Touch targets ≥ 44 px on `(hover: none)`.
