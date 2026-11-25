# Plan: pages touch and polish pass

Spec: `docs/superpowers/specs/2026-11-25-pages-touch-pass-design.md`. Execution: subagents, at most 2 at a time, with disjoint files (approved 2026-11-25). Mocks: n/a as a gate, because the approved mocks are on `.impeccable/mocks/pages-review.html`.

Every task follows TDD: write a failing vitest test (react-test-renderer, node env, see `frontend/tests/editor-floating-chrome.test.tsx` for the stubbing pattern), then the minimal code, then green. Pure CSS changes can't be unit-tested; they are proven by the live checks in task 5.

## Task 0: shared foundation (main agent, inline)

- **`frontend/src/index.css`, `@media (hover: none)` block:**
  - `.ui-button-group-item` h-10 w-10 (D7).
  - `.ui-menu-item` min-h-11 (D1).
  - `.ui-input` text-base h-11 (AU2).
- **`.playful-avatar`:** text-slate-900 (P2).
- **New `frontend/src/utils/clampToViewport.ts`:** a pure `clampToViewport({x,y},{width,height},{width,height},margin=8)` with unit tests (D4). Packages 1 and 2 use it.
- **Done when:** the tests are green and the commit is made.

## Task 1: Dashboard D1–D7 (worker, Sonnet, high)

- **Files:**
  - `components/DrawingCard.tsx`
  - `components/drawing-card/*`
  - `components/CollectionPicker.tsx`
  - `pages/dashboard/*` (`DashboardPanels.tsx`, `DashboardToolbar.tsx`, `useDashboardSelection.ts` read-only unless needed)
  - `pages/Dashboard.tsx`
  - `components/Layout.tsx` content padding only (`md:p-6`, D3)
- **Tests:**
  - ⋯ button opens the menu.
  - Tap on "Move to…" expands the list.
  - The menu position is clamped.
  - The selection circle has a touch-visible class.
  - The phone toolbar hides the selection group without a selection.
- **Done when:** spec criteria 1–6 are covered by tests where testable.

## Task 2: Sidebar S1–S4 (worker, Sonnet, high), parallel to task 1

- **Files:**
  - `components/Sidebar.tsx`
  - `components/sidebar/*` (`SidebarItem`, `SidebarContextMenu`, `SidebarFooter`)
  - `i18n.ts`
  - `components/Layout.tsx` resize-handle lines only (S3); coordinate with task 1, which touches only padding
- **Tests:**
  - ⋯ button opens the collection menu.
  - Trash is rendered in Library.
  - The footer shows the active page.
  - The resize handle has a touch-hidden class.
- **Done when:** spec criteria 7–9 are covered.

## Task 3: Settings, Profile, Admin ST1, ST2, P1, A1–A3 (worker, Sonnet, high), after task 1 or 2

- **Files:**
  - `components/PlayfulSwitch.tsx`
  - `pages/settings/*` (`SettingsRow`, `SettingsMainGrid`)
  - `pages/profile/PasswordCard.tsx`
  - `pages/admin/*` (`UsersTable`, `LoginRateLimitCard`, admin page handlers for the confirm)
- **Tests:**
  - A row tap toggles the switch.
  - The language entry is labeled with the language name.
  - Deactivation asks for confirmation.
  - Impersonate is disabled for self.
  - Card layout below `md`.
- **Done when:** spec criteria 10 (P1), 11 and 12 are covered.

## Task 4: Auth and errors G1, AU1–AU4 (worker, Sonnet, high), parallel to task 3

- **Files:**
  - `context/AuthContext.tsx`
  - `components/AuthStatusErrorPanel.tsx`
  - `components/AuthSetupChoice.tsx`
  - `pages/Login.tsx`
  - `pages/Register.tsx`
  - `pages/PasswordResetRequest.tsx`
- **Tests:**
  - A 429 shows "Too many requests" and uses `Retry-After`.
  - A network error keeps the operator hint.
  - Login renders visible labels.
  - Auth-setup has no duplicate box.
  - The reset help has a copy button.
- **Done when:** spec criteria 13 and 14 are covered.

## Task 5: integration, live verification, reviews (main agent)

- Full vitest, tsc, lint and the relevant e2e specs.
- Headless live checks with touch emulation: iPad landscape and portrait, phone, desktop 1440; light and dark; for every criterion.
- Review rounds per the delivery workflow.
- Remove the resolved review-page item from `TODO.md`.
