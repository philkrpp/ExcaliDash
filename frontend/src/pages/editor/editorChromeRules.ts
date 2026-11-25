import type { EditorChromeProps } from "./EditorChrome";

export const canShowHistory = (p: Pick<EditorChromeProps, "canEdit" | "id">) =>
  p.canEdit && Boolean(p.id);
export const canShare = (p: Pick<EditorChromeProps, "accessLevel" | "id">) =>
  p.accessLevel === "owner" && Boolean(p.id);

// shortcut: hidden peers can't be followed from the chrome; add a peer list popover if larger sessions become common.
export const MAX_VISIBLE_PEERS = 2;

/** 44px slots the wide right island needs, so the layout can fall back to the menu when they don't fit. */
export const countWideActionSlots = (
  p: Pick<
    EditorChromeProps,
    "id" | "accessLevel" | "canEdit" | "autosaveFailing" | "peers"
  >,
) =>
  Number(canShowHistory(p)) +
  Number(canShare(p)) +
  1 + // export
  1 + // own avatar
  Math.min(p.peers.length, MAX_VISIBLE_PEERS) +
  Number(p.peers.length > MAX_VISIBLE_PEERS) +
  (!p.canEdit ? 2 : Number(p.autosaveFailing)); // "Read-only" label is ~2 slots wide
