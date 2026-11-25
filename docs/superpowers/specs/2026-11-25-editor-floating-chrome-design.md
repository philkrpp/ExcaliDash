# Editor: floating chrome instead of a fixed header

## Goal

Give the canvas the full viewport height. On iPad the fixed 64 px header plus Excalidraw's tool row used ~124 px (15 % of an 834 px landscape viewport) before the first drawable pixel.

## Scope

- Remove the fixed `<header>` in `frontend/src/pages/editor/EditorView.tsx`; the Excalidraw container becomes `100dvh`.
- Left island: back button (incl. "Saving changes..." state) + drawing title (double-click / tap to rename, truncation, tooltip). Placed next to Excalidraw's ☰ menu.
- Right island via Excalidraw `renderTopRightUI`: history, share, export, own avatar + peers (follow on tap), "Unsaved changes" and "Read-only" badges. Placed left of the "Bibliothek" button.
- Narrow widths (portrait iPad, ~744–834 px): layout as chosen in the mock (see Decisions).
- Remove auto-hide: `useEditorAutoHide.ts`, header-visibility state in `useEditorChrome.ts`, `handleToggleAutoHide`, the settings card in `SettingsMainGrid.tsx`, the preference key in `PreferencesContext.tsx`, docs line in `docs/guide/configuration.md`.
- Fix: "Bibliothek" button clipped on iPad mini portrait.

## Non-goals

- Backend schema: `editorAutoHide` stays accepted (old clients, stored prefs).
- Excalidraw's own tool row, bottom bar and hint texts.
- Dashboard, share modal content.

## Decisions

- 2026-11-25 direction: floating islands (Q1), on all devices (Q2). See `DECISIONS.md`.
- Mock choice 2026-11-25: **Variant A** (`.impeccable/mocks/editor-floating-chrome.html`). Wide (≥ ~1180 px): back + title island left of the tool row next to ☰, actions + avatars right next to an icon-only library button. Narrow: back alone top-left if it fits, otherwise in the overflow menu; actions fold into a "…" island bottom-right (avatars + "…" menu with renamable title, history, share, export).

## Acceptance criteria

1. iPad 11" landscape (1194×834, touch): no element above Excalidraw's tool row; canvas container height = viewport height. Screenshot.
2. iPad 11" portrait (834×1194) and iPad mini portrait (744×1133): all actions reachable, nothing clipped (incl. "Bibliothek"), no overlap with the tool row. Screenshots.
3. Desktop 1440×900 and phone 390×844: islands render, nothing overlaps. Screenshots.
4. Back, rename (dblclick desktop, tap touch), history, share, export, follow peer still work (existing unit tests green + click-through).
5. Unsaved/read-only badges visible in the right island.
6. Settings page no longer shows "Auto-hide editor header".
7. Light + dark mode both correct.
8. `npm --prefix frontend test`, lint, typecheck green; e2e `drawing-crud.spec.ts` updated.

## Error cases

- `renderTopRightUI` not rendered (load error, loading state): back button must still be reachable — loading/error views keep a back affordance.
- History preview open (view mode): islands stay usable.
- Long titles: truncate, never push the tool row.

## Constraints

- Fork divergence: larger diff in `EditorView.tsx` raises merge conflicts with upstream ExcaliDash; keep changes contained to editor chrome files.
- Touch targets ≥ 44 px on `(hover: none)`.

## Implementation notes (from review round 1)

- Wide falls back to the "…" menu layout when the right island's slots (history, share, export, avatars, badges) don't fit beside the tool row (`fitsWideActions` in `useEditorChrome.ts`), so criteria 2/3 hold with many peers or badges.
- Avatars: at most two peers are shown (the followed one first), the rest as a "+N" chip; following a hidden peer is not possible from the chrome (`shortcut:` in `editorChromeRules.ts`).
- "Unsaved changes" shows as icon + tooltip below 1366 px and in the menu layout; the label stays available to screen readers.
- Excalidraw's own collaborator list in the top-right slot is hidden via CSS; our avatars replace it.
- During the history preview the wide actions island renders in its own raised layer (`z-[25]`), since the preview canvas covers Excalidraw's top-right slot.
- Outside the chrome files: `ShareModal.tsx` (fallback position without an anchor) and `index.css` (`.editor-island`, the two hide rules).
