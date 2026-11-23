import { useEffect, useState } from "react";
import throttle from "lodash/throttle";

// shortcut: "(hover: none)" means the primary pointer cannot hover, so a hybrid laptop with mouse and
// touchscreen keeps mouse auto-hide; add a tap trigger zone if touch-only use there becomes a need.
const TOUCH_ONLY_QUERY = "(hover: none)";

const getTouchOnlyQuery = (): MediaQueryList | null =>
  typeof window !== "undefined" && typeof window.matchMedia === "function"
    ? window.matchMedia(TOUCH_ONLY_QUERY)
    : null;

const readTouchOnly = (): boolean => getTouchOnlyQuery()?.matches ?? false;

type UseEditorChromeOptions = {
  drawingName: string;
  autoHideEnabled: boolean;
  isRenaming: boolean;
  isShareOpen: boolean;
};

export const useEditorChrome = ({
  drawingName,
  autoHideEnabled,
  isRenaming,
  isShareOpen,
}: UseEditorChromeOptions) => {
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  // Touch screens (iPad) have no mouse to reach the top trigger zone, so a hidden header could never come back.
  const [isTouchOnly, setIsTouchOnly] = useState(readTouchOnly);

  useEffect(() => {
    const mq = getTouchOnlyQuery();
    if (!mq) return;
    const sync = () => setIsTouchOnly(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    document.title = `${drawingName} - ExcaliDash`;
    return () => {
      document.title = "ExcaliDash";
    };
  }, [drawingName]);

  useEffect(() => {
    if (!autoHideEnabled || isTouchOnly || isRenaming || isShareOpen) {
      setIsHeaderVisible(true);
      return;
    }

    let hideTimeout: ReturnType<typeof setTimeout> | null = null;
    let isInTriggerZone = false;

    const handleMouseMove = throttle((e: MouseEvent) => {
      const wasInTriggerZone = isInTriggerZone;
      isInTriggerZone = e.clientY < 5;

      if (isInTriggerZone) {
        setIsHeaderVisible(true);
        if (hideTimeout !== null) {
          clearTimeout(hideTimeout);
          hideTimeout = null;
        }
      } else if (wasInTriggerZone) {
        if (hideTimeout !== null) clearTimeout(hideTimeout);
        hideTimeout = setTimeout(() => {
          setIsHeaderVisible(false);
        }, 2000);
      }
    }, 100);

    setIsHeaderVisible(true);
    hideTimeout = setTimeout(() => {
      setIsHeaderVisible(false);
    }, 3000);

    window.addEventListener("mousemove", handleMouseMove, { passive: true });

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      handleMouseMove.cancel();
      if (hideTimeout !== null) clearTimeout(hideTimeout);
    };
  }, [autoHideEnabled, isTouchOnly, isRenaming, isShareOpen]);

  return {
    isHeaderVisible,
    setIsHeaderVisible,
    isTouchOnly,
  };
};
