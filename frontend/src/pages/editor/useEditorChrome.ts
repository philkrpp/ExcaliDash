import { useEffect, useState } from "react";

// "(hover: none)" means the primary pointer cannot hover (touch-only, e.g. iPad), so hover-only affordances need a tap fallback.
const TOUCH_ONLY_QUERY = "(hover: none)";

const getTouchOnlyQuery = (): MediaQueryList | null =>
  typeof window !== "undefined" && typeof window.matchMedia === "function"
    ? window.matchMedia(TOUCH_ONLY_QUERY)
    : null;

const readTouchOnly = (): boolean => getTouchOnlyQuery()?.matches ?? false;

type UseEditorChromeOptions = {
  drawingName: string;
};

export const useEditorChrome = ({ drawingName }: UseEditorChromeOptions) => {
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

  return { isTouchOnly };
};
