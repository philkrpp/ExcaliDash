import React, { useEffect, useState } from "react";
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

const canShowHistory = (p: EditorChromeProps) => p.canEdit && Boolean(p.id);
const canShare = (p: EditorChromeProps) =>
  p.accessLevel === "owner" && Boolean(p.id);

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
      size="toolbar"
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
            "block rounded-[38%]",
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

const Collaborators = (p: EditorChromeProps) => (
  <div className="flex items-center">
    <CollaboratorAvatar user={p.me} label={`${p.me.name} (You)`} />
    {p.peers.map((peer) => (
      <CollaboratorAvatar
        key={peer.id}
        user={peer}
        label={peer.name}
        inactive={!peer.isActive}
        followed={peer.id === p.followedUserId}
        onClick={() => p.onToggleFollow(peer)}
      />
    ))}
  </div>
);

const StatusBadges = (p: EditorChromeProps & { compact?: boolean }) => (
  <>
    {p.canEdit && p.autosaveFailing ? (
      <span
        className="mx-1 flex shrink-0 items-center gap-1.5 rounded-full border border-red-200 bg-red-100 px-2 py-1 text-xs font-semibold text-red-800 dark:border-red-800 dark:bg-red-900/30 dark:text-red-200"
        title="Your recent changes could not be saved. Check your connection and try again."
        role="status"
      >
        <CloudOff size={14} />
        <span className={clsx(p.compact && "sr-only")}>Unsaved changes</span>
      </span>
    ) : null}
    {!p.canEdit ? (
      <span className="mx-1 shrink-0 rounded-full border border-amber-200 bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-900 dark:border-amber-800 dark:bg-amber-900/30 dark:text-amber-200">
        Read-only
      </span>
    ) : null}
  </>
);

const BackButton = (p: EditorChromeProps) => (
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
      p.isSavingOnLeave && "w-auto gap-2 px-3",
    )}
  >
    {p.isSavingOnLeave ? (
      <>
        <Loader2 size={20} className="animate-spin" />
        <span className="text-sm font-medium">Saving changes...</span>
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
  <div className="editor-island absolute left-[60px] top-4 z-[3] max-w-[calc(50vw-275px-76px)]">
    <BackButton {...p} />
    {p.showTitle ? (
      <>
        <Divider />
        {p.isRenaming ? (
          <div className="w-64 max-w-full px-1">
            <RenameField {...p} />
          </div>
        ) : (
          <h1
            className="min-w-0 truncate touch-manipulation cursor-text rounded px-2 py-1 font-medium text-gray-900 hover:bg-gray-100 dark:text-white dark:hover:bg-neutral-800"
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
}: {
  action: string;
  icon: React.ReactNode;
  label: React.ReactNode;
  onSelect: () => void;
  disabled?: boolean;
}) => (
  <button
    type="button"
    role="menuitem"
    data-action={action}
    disabled={disabled}
    onClick={onSelect}
    className="ui-menu-item min-h-11 disabled:cursor-wait disabled:opacity-60"
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
  // Renaming happens inside the menu, so it stays open until the name is committed or cancelled.
  const isOpen = menuOpen || p.isRenaming;
  const run = (action: () => void) => () => {
    setMenuOpen(false);
    action();
  };

  useEffect(() => {
    if (!menuOpen) return;
    // The rename field handles its own Escape (cancel), which also closes the menu.
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [menuOpen]);

  return (
    <div className="editor-island relative">
      <StatusBadges {...p} compact />
      <Collaborators {...p} />
      <Divider />
      <button
        type="button"
        onClick={() => setMenuOpen((open) => !open)}
        // Above the outside-click backdrop, so a second tap closes the menu.
        className="ui-toolbar-button relative z-10"
        aria-label="More actions"
        aria-haspopup="menu"
        aria-expanded={isOpen}
      >
        <Ellipsis size={20} />
      </button>
      {isOpen ? (
        <>
          <div
            className="fixed inset-0"
            onClick={() => setMenuOpen(false)}
            aria-hidden
          />
          <div
            role="menu"
            aria-label="Drawing actions"
            className="ui-menu absolute bottom-full right-0 z-10 mb-2 w-64"
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
        </>
      ) : null}
    </div>
  );
};
