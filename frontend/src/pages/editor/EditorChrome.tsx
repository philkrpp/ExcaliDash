import React, { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import {
  ArrowLeft,
  CloudOff,
  Download,
  Ellipsis,
  History,
  Loader2,
  PencilLine,
  Share2,
} from "lucide-react";
import { InlineEditInput } from "../../components/InlineEditInput";
import { UserAvatar as ProfileAvatar } from "../../components/UserAvatar";
import type { UserIdentity } from "../../utils/identity";
import type { Peer } from "./useEditorCollaboration";
import {
  MAX_VISIBLE_PEERS,
  canShare,
  canShowHistory,
} from "./editorChromeRules";

export type EditorChromeProps = {
  id?: string;
  accessLevel: "none" | "view" | "edit" | "owner";
  autosaveFailing: boolean;
  canEdit: boolean;
  drawingName: string;
  isRenaming: boolean;
  isSavingOnLeave: boolean;
  isTouchOnly: boolean;
  me: UserIdentity;
  newName: string;
  peers: Peer[];
  followedUserId: string | null;
  onToggleFollow: (peer: Peer) => void;
  onBackClick: () => void;
  onBackIntent: () => void;
  onExportClick: () => void;
  onHistoryOpen: () => void;
  onNewNameChange: (value: string) => void;
  onRenameCancel: () => void;
  onRenameStart: () => void;
  onRenameSubmit: () => void;
  onShareOpen: () => void;
};

const Divider = () => (
  <div className="mx-0.5 h-6 w-px shrink-0 bg-slate-200 dark:bg-neutral-700" />
);

const CollaboratorAvatar = ({
  user,
  label,
  inactive = false,
  followed = false,
  onClick,
}: {
  user: UserIdentity;
  label: string;
  inactive?: boolean;
  followed?: boolean;
  onClick?: () => void;
}) => {
  const title = onClick
    ? `${followed ? "Stop following" : "Follow"} ${label}`
    : label;
  const avatar = (
    <ProfileAvatar
      name={user.name}
      size="sm"
      className={clsx(
        "transition-all duration-300",
        inactive && "opacity-30 grayscale",
      )}
    />
  );
  return (
    <div
      className="relative group grid h-10 w-10 place-items-center [@media(hover:none)]:h-11 [@media(hover:none)]:w-11"
      data-testid="collaborator-avatar"
    >
      {onClick ? (
        <button
          type="button"
          onClick={onClick}
          aria-pressed={followed}
          aria-label={title}
          className={clsx(
            "grid h-full w-full place-items-center rounded-[38%]",
            followed &&
              "ring-2 ring-indigo-500 ring-offset-2 dark:ring-offset-neutral-900",
          )}
        >
          {avatar}
        </button>
      ) : (
        <span title={title}>{avatar}</span>
      )}
    </div>
  );
};

const Collaborators = (p: EditorChromeProps) => {
  // The followed peer stays visible so following can always be stopped.
  const ordered = [...p.peers].sort(
    (a, b) =>
      Number(b.id === p.followedUserId) - Number(a.id === p.followedUserId),
  );
  const visible = ordered.slice(0, MAX_VISIBLE_PEERS);
  const hidden = ordered.slice(MAX_VISIBLE_PEERS);
  return (
    <div className="flex shrink-0 items-center">
      <CollaboratorAvatar user={p.me} label={`${p.me.name} (You)`} />
      {visible.map((peer) => (
        <CollaboratorAvatar
          key={peer.id}
          user={peer}
          label={peer.name}
          inactive={!peer.isActive}
          followed={peer.id === p.followedUserId}
          onClick={() => p.onToggleFollow(peer)}
        />
      ))}
      {hidden.length > 0 ? (
        <span
          className="mx-1 rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600 dark:bg-neutral-800 dark:text-neutral-300"
          title={hidden.map((peer) => peer.name).join(", ")}
          role="img"
          aria-label={`${hidden.length} more: ${hidden.map((peer) => peer.name).join(", ")}`}
        >
          {`+${hidden.length}`}
        </span>
      ) : null}
    </div>
  );
};

const StatusBadges = (p: EditorChromeProps & { compact?: boolean }) => (
  <>
    {p.canEdit && p.autosaveFailing ? (
      <span
        className="mx-1 flex shrink-0 items-center gap-1.5 rounded-full border border-red-200 bg-red-100 px-2 py-1 text-xs font-semibold text-red-800 dark:border-red-800 dark:bg-red-900/30 dark:text-red-200"
        title="Your recent changes could not be saved. Check your connection and try again."
        role="status"
      >
        <CloudOff size={14} />
        <span
          className={
            // The wide right island only has room for the label on large screens.
            p.compact ? "sr-only" : "sr-only min-[1366px]:not-sr-only"
          }
        >
          Unsaved changes
        </span>
      </span>
    ) : null}
    {!p.canEdit ? (
      <span className="mx-1 shrink-0 rounded-full border border-amber-200 bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-900 dark:border-amber-800 dark:bg-amber-900/30 dark:text-amber-200">
        Read-only
      </span>
    ) : null}
  </>
);

const BackButton = (p: EditorChromeProps & { showLabel: boolean }) => (
  <button
    type="button"
    onClick={p.onBackClick}
    onPointerEnter={p.onBackIntent}
    onFocus={p.onBackIntent}
    disabled={p.isSavingOnLeave}
    aria-label="Back to dashboard"
    title="Back to dashboard"
    className={clsx(
      "ui-toolbar-button disabled:cursor-wait",
      p.isSavingOnLeave && p.showLabel && "w-auto gap-2 px-3",
    )}
  >
    {p.isSavingOnLeave ? (
      <>
        <Loader2 size={20} className="animate-spin" />
        <span className={p.showLabel ? "text-sm font-medium" : "sr-only"}>
          Saving changes...
        </span>
      </>
    ) : (
      <ArrowLeft size={20} />
    )}
  </button>
);

const RenameField = (p: EditorChromeProps) => (
  <InlineEditInput
    aria-label="Drawing name"
    value={p.newName}
    onChange={(e) => p.onNewNameChange(e.target.value)}
    onCommit={p.onRenameSubmit}
    onCancel={p.onRenameCancel}
    className="min-w-0 w-full rounded-md border-2 border-indigo-500 bg-transparent px-2 py-1 font-medium text-gray-900 outline-none dark:text-white"
  />
);

/** Top-left, next to Excalidraw's menu button: back, and the title when there is room. */
export const EditorTitleIsland = (
  p: EditorChromeProps & { showTitle: boolean },
) => (
  <div className="editor-island max-w-full">
    <BackButton {...p} showLabel={p.showTitle} />
    {p.showTitle ? (
      <>
        <Divider />
        {p.isRenaming ? (
          <div className="w-64 max-w-full px-1">
            <RenameField {...p} />
          </div>
        ) : (
          <h1
            className="min-w-0 truncate touch-manipulation cursor-text rounded px-2 py-1 font-medium text-gray-900 [@media(hover:none)]:py-2.5 hover:bg-gray-100 dark:text-white dark:hover:bg-neutral-800"
            title={p.drawingName}
            onDoubleClick={p.onRenameStart}
            // Touch screens have no tooltip or dblclick: a tap shows the full (truncated) name in the rename field.
            onClick={p.isTouchOnly ? p.onRenameStart : undefined}
          >
            {p.drawingName}
          </h1>
        )}
      </>
    ) : null}
  </div>
);

/** Rendered in Excalidraw's top-right slot on wide screens. */
export const EditorActionsIsland = ({
  historyButtonRef,
  shareButtonRef,
  ...p
}: EditorChromeProps & {
  historyButtonRef: React.RefObject<HTMLButtonElement>;
  shareButtonRef: React.RefObject<HTMLButtonElement>;
}) => (
  <div className="editor-island">
    <StatusBadges {...p} />
    {canShowHistory(p) ? (
      <button
        ref={historyButtonRef}
        type="button"
        onClick={p.onHistoryOpen}
        className="ui-toolbar-button"
        aria-label="Version history"
        title="Version history"
      >
        <History size={20} />
      </button>
    ) : null}
    {canShare(p) ? (
      <button
        ref={shareButtonRef}
        type="button"
        onClick={p.onShareOpen}
        className="ui-toolbar-button"
        aria-label="Share"
        title="Share"
      >
        <Share2 size={20} />
      </button>
    ) : null}
    <button
      type="button"
      onClick={p.onExportClick}
      className="ui-toolbar-button"
      aria-label="Export drawing"
      title="Export drawing"
    >
      <Download size={20} />
    </button>
    <Divider />
    <Collaborators {...p} />
  </div>
);

const MenuItem = ({
  action,
  icon,
  label,
  onSelect,
  disabled,
  ariaLabel,
  emphasis = false,
}: {
  action: string;
  ariaLabel?: string;
  emphasis?: boolean;
  icon: React.ReactNode;
  label: React.ReactNode;
  onSelect: () => void;
  disabled?: boolean;
}) => (
  <button
    type="button"
    role="menuitem"
    data-action={action}
    aria-label={ariaLabel}
    disabled={disabled}
    onClick={onSelect}
    className={clsx(
      "ui-menu-item min-h-11 disabled:cursor-wait disabled:opacity-60",
      emphasis && "font-semibold text-slate-900 dark:text-white",
    )}
  >
    {icon}
    <span className="min-w-0 truncate">{label}</span>
  </button>
);

/**
 * Narrow screens: collaborators plus a "…" menu with every action.
 * Popovers opened from here have no anchor and use their default top-right position.
 */
export const EditorOverflowIsland = (
  p: EditorChromeProps & { showBack: boolean },
) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const islandRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  // Renaming happens inside the menu, so it stays open until the name is committed or cancelled.
  const isOpen = menuOpen || p.isRenaming;
  const close = (restoreFocus: boolean) => {
    setMenuOpen(false);
    if (restoreFocus) triggerRef.current?.focus();
  };
  const run = (action: () => void) => () => {
    close(true);
    action();
  };
  const items = () =>
    Array.from(
      menuRef.current?.querySelectorAll<HTMLButtonElement>(
        '[role="menuitem"]:not(:disabled)',
      ) ?? [],
    );

  // The rename field unmounts on commit/cancel; hand focus back to the trigger instead of <body>.
  const wasRenaming = useRef(p.isRenaming);
  useEffect(() => {
    if (wasRenaming.current && !p.isRenaming) triggerRef.current?.focus();
    wasRenaming.current = p.isRenaming;
  }, [p.isRenaming]);

  useEffect(() => {
    if (!menuOpen) return;
    items()[0]?.focus();
    // The rename field handles its own Escape (cancel), which also closes the menu.
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close(true);
      if (event.key === "Tab") close(false);
    };
    // Capture phase: Excalidraw's UI sits above this island and would otherwise swallow outside taps.
    const onPointerDown = (event: Event) => {
      if (!islandRef.current?.contains(event.target as Node)) close(false);
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("pointerdown", onPointerDown, true);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("pointerdown", onPointerDown, true);
    };
  }, [menuOpen]);

  return (
    <div ref={islandRef} className="editor-island relative">
      <StatusBadges {...p} compact />
      <Collaborators {...p} />
      <Divider />
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setMenuOpen((open) => !open)}
        className="ui-toolbar-button"
        aria-label="More actions"
        aria-haspopup="menu"
        aria-expanded={isOpen}
      >
        <Ellipsis size={20} />
      </button>
      {isOpen ? (
        <div
          ref={menuRef}
          role="menu"
          aria-label="Drawing actions"
          // Short (landscape phone) screens: beside the island, so all items fit below Excalidraw's top bar;
          // the height cap is only a fallback for even shorter screens.
          className="ui-menu absolute bottom-full right-0 z-10 mb-2 max-h-[calc(100dvh-200px)] w-64 overflow-y-auto [@media(max-height:499.98px)]:bottom-0 [@media(max-height:499.98px)]:right-full [@media(max-height:499.98px)]:mb-0 [@media(max-height:499.98px)]:mr-2 [@media(max-height:499.98px)]:max-h-[calc(100dvh-140px)]"
          onKeyDown={(event) => {
            if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
            event.preventDefault();
            const list = items();
            const index = list.indexOf(
              document.activeElement as HTMLButtonElement,
            );
            const step = event.key === "ArrowDown" ? 1 : -1;
            list[(index + step + list.length) % list.length]?.focus();
          }}
        >
          {p.isRenaming ? (
            <div className="p-1">
              <RenameField {...p} />
            </div>
          ) : p.canEdit ? (
            <MenuItem
              action="rename"
              icon={<PencilLine size={18} className="shrink-0" />}
              label={p.drawingName}
              ariaLabel={`Rename "${p.drawingName}"`}
              emphasis
              onSelect={run(p.onRenameStart)}
            />
          ) : (
            <div className="truncate px-2.5 py-2 text-sm font-semibold text-slate-800 dark:text-neutral-100">
              {p.drawingName}
            </div>
          )}
          <div className="ui-menu-separator" />
          {p.showBack ? (
            <MenuItem
              action="back"
              icon={
                p.isSavingOnLeave ? (
                  <Loader2 size={18} className="shrink-0 animate-spin" />
                ) : (
                  <ArrowLeft size={18} className="shrink-0" />
                )
              }
              label={
                p.isSavingOnLeave ? "Saving changes..." : "Back to dashboard"
              }
              disabled={p.isSavingOnLeave}
              onSelect={run(p.onBackClick)}
            />
          ) : null}
          {canShowHistory(p) ? (
            <MenuItem
              action="history"
              icon={<History size={18} className="shrink-0" />}
              label="Version history"
              onSelect={run(p.onHistoryOpen)}
            />
          ) : null}
          {canShare(p) ? (
            <MenuItem
              action="share"
              icon={<Share2 size={18} className="shrink-0" />}
              label="Share"
              onSelect={run(p.onShareOpen)}
            />
          ) : null}
          <MenuItem
            action="export"
            icon={<Download size={18} className="shrink-0" />}
            label="Export drawing"
            onSelect={run(p.onExportClick)}
          />
        </div>
      ) : null}
    </div>
  );
};
