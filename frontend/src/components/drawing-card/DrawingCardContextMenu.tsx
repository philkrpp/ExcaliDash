import clsx from "clsx";
import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  ArrowRight,
  Copy,
  Download,
  EyeOff,
  FolderInput,
  HardDrive,
  Loader2,
  PenTool,
  Trash2,
} from "lucide-react";
import type { Collection, DrawingSummary } from "../../types";
import { CollectionMoveOptions } from "./CollectionMoveOptions";
import { clampToViewport } from "../../utils/clampToViewport";
import { useMenuKeyboard } from "../../hooks/useMenuKeyboard";

interface DrawingCardContextMenuProps {
  drawing: DrawingSummary;
  collections: Collection[];
  position: { x: number; y: number };
  isTrash: boolean;
  isShared: boolean;
  storageAvailable: boolean;
  isExporting: boolean;
  exportError: string | null;
  showMoveSubmenu: boolean;
  onShowMoveSubmenu: (show: boolean) => void;
  onClose: () => void;
  onRename: () => void;
  onMoveToCollection: (id: string, collectionId: string | null) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onHide?: (id: string) => void;
  onManageStorage: () => void;
  onExport: (e: React.MouseEvent) => Promise<void>;
}

const SUBMENU_CLOSE_DELAY_MS = 300;
export const DRAWING_MENU_WIDTH = 192;
const SUBMENU_WIDTH = 192;
/** Matches the submenu's `max-h-64`. */
const SUBMENU_MAX_HEIGHT = 256;
const SUBMENU_GAP = 6;
const VIEWPORT_MARGIN = 8;

// Mouse hover opens the submenu; touch taps (and their emulated hover) must not.
const isMouse = (event: React.PointerEvent) => event.pointerType === "mouse";

export const DrawingCardContextMenu: React.FC<DrawingCardContextMenuProps> = ({
  drawing,
  collections,
  position,
  isTrash,
  isShared,
  storageAvailable,
  isExporting,
  exportError,
  showMoveSubmenu,
  onShowMoveSubmenu,
  onClose,
  onRename,
  onMoveToCollection,
  onDuplicate,
  onDelete,
  onHide,
  onManageStorage,
  onExport,
}) => {
  const closeTimer = useRef<number | null>(null);
  const lastPointerType = useRef<string>("touch");
  const menuRef = useRef<HTMLDivElement>(null);
  const moveRowRef = useRef<HTMLDivElement>(null);
  const [placement, setPlacement] = useState({
    x: position.x,
    y: position.y,
    submenuLeft: false,
    submenuUp: false,
  });
  useMenuKeyboard(menuRef, onClose);

  // Measure after render and keep the menu (and its hover submenu) inside the viewport.
  useLayoutEffect(() => {
    const element = menuRef.current;
    if (!element) return;
    // offset* ignores the zoom-in animation's transform, unlike getBoundingClientRect.
    const width = element.offsetWidth;
    const height = element.offsetHeight;
    const viewport = { width: window.innerWidth, height: window.innerHeight };
    const clamped = clampToViewport(
      position,
      { width, height },
      viewport,
      VIEWPORT_MARGIN,
    );
    const submenuRight = clamped.x + width + SUBMENU_GAP + SUBMENU_WIDTH;
    const rowTop = clamped.y + (moveRowRef.current?.offsetTop ?? 0);
    setPlacement({
      ...clamped,
      submenuLeft: submenuRight + VIEWPORT_MARGIN > viewport.width,
      submenuUp: rowTop + SUBMENU_MAX_HEIGHT + VIEWPORT_MARGIN > viewport.height,
    });
  }, [position, showMoveSubmenu]);

  const openSubmenu = () => {
    if (closeTimer.current !== null) {
      window.clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
    onShowMoveSubmenu(true);
  };

  const scheduleSubmenuClose = () => {
    if (closeTimer.current !== null) window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => {
      onShowMoveSubmenu(false);
    }, SUBMENU_CLOSE_DELAY_MS);
  };

  useEffect(
    () => () => {
      if (closeTimer.current !== null) window.clearTimeout(closeTimer.current);
    },
    [],
  );

  return createPortal(
    <div
      className="fixed inset-0 z-50"
      onClick={onClose}
      onContextMenu={(e) => {
        e.preventDefault();
        onClose();
      }}
    >
      <div
        ref={menuRef}
        data-testid="drawing-card-menu"
        className="ui-menu absolute w-48 animate-in fade-in zoom-in-95 duration-100 [@media(hover:none)]:max-h-[calc(100dvh-1rem)] [@media(hover:none)]:overflow-y-auto"
        style={{ top: placement.y, left: placement.x }}
        onClick={(e) => e.stopPropagation()}
      >
        {!isTrash &&
        (!isShared ||
          drawing.accessLevel === "edit" ||
          drawing.accessLevel === "owner") ? (
          <button onClick={onRename} className="ui-menu-item">
            <PenTool size={14} /> Rename
          </button>
        ) : null}
        {!isShared ? (
          <div
            ref={moveRowRef}
            className="relative"
            data-testid="drawing-card-move-to"
            onPointerEnter={(e) => isMouse(e) && openSubmenu()}
            onPointerLeave={(e) => isMouse(e) && scheduleSubmenuClose()}
          >
            <button
              className="ui-menu-item justify-between"
              aria-expanded={showMoveSubmenu}
              onPointerDown={(e) => {
                lastPointerType.current = e.pointerType;
              }}
              onClick={() => {
                // A mouse already opened it on hover, so a click must not close it again.
                if (lastPointerType.current === "mouse") openSubmenu();
                else onShowMoveSubmenu(!showMoveSubmenu);
              }}
            >
              <span className="flex items-center gap-2">
                <FolderInput size={14} /> Move to...
              </span>
              <ArrowRight size={12} />
            </button>
            {showMoveSubmenu && (
              <>
                {/* Safe-triangle bridge: invisible hover area connecting the
                    row to its submenu so diagonal mouse moves don't close it. */}
                <div
                  className={clsx(
                    "absolute top-0 z-40 h-full w-3 [@media(hover:none)]:hidden",
                    placement.submenuLeft ? "right-full" : "left-full",
                  )}
                  onPointerEnter={(e) => isMouse(e) && openSubmenu()}
                />
                <div
                  data-testid="drawing-card-move-submenu"
                  className={clsx(
                    "ui-menu absolute z-50 max-h-64 w-48 overflow-y-auto",
                    placement.submenuUp ? "-bottom-1" : "-top-1",
                    placement.submenuLeft ? "right-full mr-1.5" : "left-full ml-1.5",
                    // On touch the list expands inside the menu instead of floating beside it.
                    "[@media(hover:none)]:static [@media(hover:none)]:m-0 [@media(hover:none)]:w-full [@media(hover:none)]:max-h-none [@media(hover:none)]:border-0 [@media(hover:none)]:bg-transparent [@media(hover:none)]:shadow-none",
                  )}
                  onPointerEnter={(e) => isMouse(e) && openSubmenu()}
                  onPointerLeave={(e) => isMouse(e) && scheduleSubmenuClose()}
                >
                  <CollectionMoveOptions
                    collections={collections}
                    currentCollectionId={drawing.collectionId}
                    drawingId={drawing.id}
                    onMoveToCollection={onMoveToCollection}
                    onDone={onClose}
                    optionClassName="ui-menu-item justify-between"
                    selectedClassName="ui-menu-item-selected"
                    unselectedClassName=""
                    checkSize={12}
                  />
                </div>
              </>
            )}
          </div>
        ) : null}
        {!isShared ? (
          <>
            <div className="ui-menu-separator" />
            <button
              onClick={() => {
                onDuplicate(drawing.id);
                onClose();
              }}
              className="ui-menu-item"
            >
              <Copy size={14} /> Duplicate
            </button>
          </>
        ) : null}
        {!isShared && storageAvailable ? (
          <>
            <button onClick={onManageStorage} className="ui-menu-item">
              <HardDrive size={14} /> Manage storage
            </button>
            <div className="ui-menu-separator" />
          </>
        ) : null}
        <button
          onClick={onExport}
          disabled={isExporting}
          className="ui-menu-item disabled:opacity-50"
        >
          {isExporting ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Download size={14} />
          )}
          {isExporting ? "Exporting..." : "Export"}
        </button>
        {exportError && (
          <div className="mx-1 my-1 rounded-lg border-2 border-rose-200 bg-rose-50 px-2.5 py-1.5 text-xs font-semibold text-rose-600 dark:border-rose-800 dark:bg-rose-900/20 dark:text-rose-400">
            {exportError}
          </div>
        )}
        {!isShared ? (
          <>
            <div className="ui-menu-separator" />
            <button
              onClick={() => {
                onDelete(drawing.id);
                onClose();
              }}
              className="ui-menu-item ui-menu-item-danger"
            >
              <Trash2 size={14} /> Delete
            </button>
          </>
        ) : null}
        {isShared && onHide ? (
          <>
            <div className="ui-menu-separator" />
            <button
              onClick={() => {
                onHide(drawing.id);
                onClose();
              }}
              className="ui-menu-item"
            >
              <EyeOff size={14} /> Hide from my list
            </button>
          </>
        ) : null}
      </div>
    </div>,
    document.body,
  );
};
