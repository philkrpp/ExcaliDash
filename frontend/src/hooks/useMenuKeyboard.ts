import { useEffect, useRef, type RefObject } from "react";

const ITEM_SELECTOR = "button:not([disabled])";

/**
 * Keyboard support for a popup menu: focuses its first item on open, moves focus
 * with ArrowUp/ArrowDown, closes on Escape and hands focus back to whatever was
 * focused before (usually the trigger button) when the menu unmounts.
 */
export const useMenuKeyboard = (
  menuRef: RefObject<HTMLElement>,
  onClose: () => void,
) => {
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const menu = menuRef.current;
    if (!menu) return;
    const previous = document.activeElement as HTMLElement | null;
    menu.querySelector<HTMLElement>(ITEM_SELECTOR)?.focus({
      preventScroll: true,
    });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        onCloseRef.current();
        return;
      }
      if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
      const items = Array.from(
        menu.querySelectorAll<HTMLElement>(ITEM_SELECTOR),
      );
      if (items.length === 0) return;
      event.preventDefault();
      const index = items.indexOf(document.activeElement as HTMLElement);
      const step = event.key === "ArrowDown" ? 1 : -1;
      items[(index + step + items.length) % items.length].focus();
    };

    document.addEventListener("keydown", handleKeyDown, true);
    return () => {
      document.removeEventListener("keydown", handleKeyDown, true);
      // Only hand focus back if it was lost with the menu; an action like
      // "Rename" may already have focused its own input.
      const active = document.activeElement;
      const focusLost =
        !active || active === document.body || menu.contains(active);
      if (
        focusLost &&
        previous &&
        previous !== document.body &&
        previous.isConnected
      ) {
        previous.focus({ preventScroll: true });
      }
    };
  }, [menuRef]);
};
