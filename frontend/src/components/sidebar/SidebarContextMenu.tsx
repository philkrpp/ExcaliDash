import React, { useLayoutEffect, useRef, useState } from "react";
import { Edit2, Plus, Share2, Trash2 } from "lucide-react";
import type { Collection } from "../../types";
import { clampToViewport } from "../../utils/clampToViewport";
import { useMenuKeyboard } from "../../hooks/useMenuKeyboard";

/** Matches the `w-52` class on the menu; used to right-align it under a button. */
export const SIDEBAR_MENU_WIDTH = 208;

export type SidebarContextMenuState = {
  x: number;
  y: number;
  type: "item" | "background";
  id?: string;
};

interface SidebarContextMenuProps {
  contextMenu: SidebarContextMenuState;
  collections: Collection[];
  onClose: () => void;
  onCreateCollection: () => void;
  onRenameCollection: (collection: Collection) => void;
  onShareCollection: (id: string) => void;
  onDeleteCollection: (id: string) => void;
}

export const SidebarContextMenu: React.FC<SidebarContextMenuProps> = ({
  contextMenu,
  collections,
  onClose,
  onCreateCollection,
  onRenameCollection,
  onShareCollection,
  onDeleteCollection,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({
    x: contextMenu.x,
    y: contextMenu.y,
  });

  useLayoutEffect(() => {
    const requested = { x: contextMenu.x, y: contextMenu.y };
    // offset* ignores the zoom-in animation's transform, unlike getBoundingClientRect.
    const menu = menuRef.current;
    setPosition(
      menu
        ? clampToViewport(
            requested,
            { width: menu.offsetWidth, height: menu.offsetHeight },
            { width: window.innerWidth, height: window.innerHeight },
          )
        : requested,
    );
  }, [contextMenu.x, contextMenu.y, contextMenu.type, contextMenu.id]);

  useMenuKeyboard(menuRef, onClose);

  return (
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
      className="ui-menu absolute w-52 animate-in fade-in zoom-in-95 duration-100"
      style={{ top: position.y, left: position.x }}
      onClick={(e) => e.stopPropagation()}
    >
      {contextMenu.type === "item" && contextMenu.id ? (
        <>
          <button
            onClick={() => {
              onShareCollection(contextMenu.id!);
              onClose();
            }}
            className="ui-menu-item"
          >
            <Share2 size={14} /> Share Collection
          </button>
          <button
            onClick={() => {
              const collection = collections.find(
                (c) => c.id === contextMenu.id,
              );
              if (collection) onRenameCollection(collection);
              onClose();
            }}
            className="ui-menu-item"
          >
            <Edit2 size={14} /> Rename Collection
          </button>
          <div className="ui-menu-separator" />
          <button
            onClick={() => {
              onDeleteCollection(contextMenu.id!);
              onClose();
            }}
            className="ui-menu-item ui-menu-item-danger"
          >
            <Trash2 size={14} /> Delete Collection
          </button>
        </>
      ) : (
        <button
          onClick={() => {
            onCreateCollection();
            onClose();
          }}
          className="ui-menu-item"
        >
          <Plus size={14} /> New Collection
        </button>
      )}
    </div>
  </div>
  );
};
