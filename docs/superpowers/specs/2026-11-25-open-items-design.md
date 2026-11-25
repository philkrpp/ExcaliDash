# Open items after the pages touch pass

## Goal

Close the three open `TODO.md` items: hidden editor peers, keyboard rename of the editor title, and the dashboard "Select All" race.

## Scope and decisions (see `DECISIONS.md`, 2026-11-25)

- **Peer list:** "+N" becomes a button that opens a list of everyone in the drawing (own row "(You)", then each peer with name and a Follow/Following toggle). On touch, tapping an avatar opens the same list instead of following at once. On desktop, clicking an avatar still follows directly.
- **Title rename:** in the wide layout the title is focusable; Enter starts renaming (only when the user can edit).
- **Selection on refresh:** a list refresh keeps the selection while every selected drawing is still listed, and clears it otherwise (a refresh reloads only the first page, so a partial prune would silently shrink a multi-page selection). A loading placeholder never changes it. Typing a search and switching views still clear it.

## Non-goals

No change to the narrow overflow menu, to follow semantics, or to the server.

## Acceptance criteria

1. Editor with more than 2 peers: "+N" is a 44 px button on touch; tap/click opens the list; every peer can be followed and unfollowed from it; Escape and an outside tap close it and focus returns to "+N".
2. Touch: tapping a visible avatar opens the list (names visible); desktop click follows directly.
3. Wide layout, keyboard: Tab reaches the title, Enter opens the rename field; view-only users can't rename.
4. Dashboard: type a search, press "Select All" before the debounced request returns: the selection survives the refresh. Bulk trash still clears trashed ids; a refresh that no longer lists a selected drawing clears the selection.
5. Unit tests, lint, typecheck and the dashboard e2e specs are green.

## Plan (inline, approved 2026-11-25)

1. `frontend/src/pages/Dashboard.tsx`: replace `onRefreshSuccess: resetSelection` with pruning against `drawings`; drop the now unused `onRefreshSuccess` from `useDashboardData`. Test first.
2. `frontend/src/pages/editor/EditorChrome.tsx`: title as a button inside the `h1` (keyboard click → rename). Test first.
3. `EditorChrome.tsx` (`Collaborators`): "+N" button and peer list popover, avatar tap on touch opens it; remove the shortcut comment in `editorChromeRules.ts`. Test first.
4. Live check (desktop, iPad touch, phone; light/dark), review round, acceptance.
