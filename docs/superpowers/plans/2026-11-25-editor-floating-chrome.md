# Plan: editor floating chrome

Spec: `docs/superpowers/specs/2026-11-25-editor-floating-chrome-design.md`

Phases: Mocks (gate) → implementation → live verification → reviews → acceptance.

## Tasks

1. **Mocks** (main agent, Impeccable). 3 HTML variants of the editor top area at iPad landscape, iPad portrait, desktop, phone; light + dark. Surface: editor top row + right island + narrow-width behaviour. Local file under `.impeccable/mocks/`, opened with `open`. Done: user picked a variant, choice noted in spec.
2. **Remove auto-hide** (worker, high effort). `useEditorAutoHide.ts` (delete), `useEditorChrome.ts` (keep title + `isTouchOnly`, drop header visibility), `useEditorCommands.ts` (`handleToggleAutoHide`), `Editor.tsx`, `SettingsMainGrid.tsx`, `Settings.tsx`, `PreferencesContext.tsx`, `docs/guide/configuration.md`; tests `editor-chrome-touch`, `editor-history-sharing`, `inline-rename`, `editor-back-deleted-drawing`. Red first: test asserting the settings page has no auto-hide card and `useEditorChrome` exposes no header visibility. Done: vitest + tsc green.
3. **Floating islands** (main agent, Impeccable craft rules; depends on 1+2). `EditorView.tsx`: drop `<header>`, new `EditorTitleIsland` (left overlay) and `EditorActionsIsland` (via `renderTopRightUI`), narrow-width behaviour per mock; container `100dvh`. Red first: `inline-rename.test.tsx` / `editor-history-sharing.test.tsx` render the islands (rename, history, share, export, badges, follow). Done: vitest + lint + tsc green.
4. **e2e update** (worker). `e2e/tests/drawing-crud.spec.ts` auto-hide block → assert islands visible and canvas full height. Done: spec passes locally.
5. **Live verification** (main). Playwright with touch emulation at 1194×834, 834×1194, 744×1133, 1440×900, 390×844, light + dark; Impeccable detect/audit; console clean. Evidence per acceptance criterion.
6. **Review rounds**: requesting-code-review → code-review → Impeccable critique.

## Execution

Small/medium: 3 implementation tasks. Recommendation: inline (main agent) for 3, one worker for 2+4.

Local run: backend container `excalidash-backend-local` (port 28000, AUTH_MODE=disabled) + `vite --port 26767` with `VITE_DEV_BACKEND_URL`. (`npm ci` in `backend/` is blocked by a pnpm hook.)
