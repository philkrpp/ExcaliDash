import React, { useState } from "react";
import clsx from "clsx";
import { MoreHorizontal } from "lucide-react";
import { InlineEditInput } from "../InlineEditInput";

interface SidebarItemProps {
  id: string | null;
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
  onDoubleClick?: () => void;
  onContextMenu?: (e: React.MouseEvent) => void;
  /** Opens the item menu from a visible button (touch has no right-click). */
  onMenuClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  /** Accessible name of the ⋯ button (translated by the caller). */
  menuLabel?: string;
  extraAction?: React.ReactNode;
  isEditing?: boolean;
  editValue?: string;
  onEditChange?: (val: string) => void;
  onEditCommit?: () => void;
  onEditCancel?: () => void;
  onDrop?: (e: React.DragEvent, collectionId: string | null) => void;
}

export const SidebarItem: React.FC<SidebarItemProps> = ({
  id,
  icon,
  label,
  isActive,
  onClick,
  onDoubleClick,
  onContextMenu,
  onMenuClick,
  menuLabel,
  extraAction,
  isEditing,
  editValue,
  onEditChange,
  onEditCommit,
  onEditCancel,
  onDrop,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);

  return (
    <div className="relative group/item pl-3 pr-2">
      {isEditing ? (
        <div className="py-1">
          <InlineEditInput
            value={editValue}
            onChange={(e) => onEditChange?.(e.target.value)}
            onCommit={() => onEditCommit?.()}
            onCancel={() => onEditCancel?.()}
            aria-label="Collection name"
            className="ui-input w-full font-medium"
          />
        </div>
      ) : (
        <div
          role="button"
          tabIndex={0}
          onClick={onClick}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onClick();
            }
          }}
          onDoubleClick={onDoubleClick}
          onContextMenu={onContextMenu}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragOver(false);
            onDrop?.(e, id);
          }}
          className={clsx(
            "w-full flex items-center gap-3 px-3 py-2 [@media(hover:none)]:py-2.5 text-sm font-semibold rounded-xl border-2 group cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:focus-visible:ring-2 dark:focus-visible:ring-neutral-500",
            onMenuClick && "pr-10 [@media(hover:none)]:pr-12",
            isActive || isDragOver
              ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-900 dark:text-indigo-100 border-slate-800 dark:border-neutral-600 shadow-[1.5px_1.5px_0px_0px_rgba(30,41,59,0.9)] dark:shadow-[1.5px_1.5px_0px_0px_rgba(255,255,255,0.18)]"
              : "text-slate-600 dark:text-neutral-400 border-transparent hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-neutral-800 dark:hover:text-neutral-100",
          )}
        >
          <span
            className={clsx(
              isActive || isDragOver
                ? "text-indigo-600 dark:text-indigo-300"
                : "text-slate-400 dark:text-neutral-500 group-hover:text-slate-900 dark:group-hover:text-neutral-200",
            )}
          >
            {icon}
          </span>
          <span className="min-w-0 flex-1 truncate text-left font-semibold">
            {label}
          </span>
          {extraAction && (
            <div className="flex items-center gap-1 flex-shrink-0">
              {extraAction}
            </div>
          )}
        </div>
      )}
      {!isEditing && onMenuClick && (
        <button
          type="button"
          aria-label={menuLabel ?? label}
          onClick={onMenuClick}
          className="ui-icon-button absolute right-3 top-1/2 h-7 w-7 -translate-y-1/2 border-transparent bg-transparent text-slate-500 opacity-0 shadow-none focus-visible:opacity-100 group-hover/item:opacity-100 group-focus-within/item:opacity-100 dark:border-transparent dark:bg-transparent dark:text-neutral-400 dark:shadow-none [@media(hover:none)]:right-2 [@media(hover:none)]:h-11 [@media(hover:none)]:w-11 [@media(hover:none)]:opacity-100"
        >
          <MoreHorizontal size={16} />
        </button>
      )}
    </div>
  );
};
