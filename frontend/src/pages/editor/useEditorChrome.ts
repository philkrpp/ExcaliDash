import { useEffect, useState } from "react";

// "(hover: none)" means the primary pointer cannot hover (touch-only, e.g. iPad), so hover-only affordances need a tap fallback.
const TOUCH_ONLY_QUERY = "(hover: none)";
// Mirrors Excalidraw 0.18's mobile switch (width < 730, or height < 500 and width < 1000); its UI moves the tools then.
const MOBILE_QUERY =
  "(max-width: 729.98px), (max-height: 499.98px) and (max-width: 999.98px)";
// shortcut: breakpoints assume Excalidraw's ~550px centered tool row; measure the row if it changes size (locale, new tools).
// Wide: back + title left of the tool row, actions right of it (iPad 11" landscape and larger).
const WIDE_QUERY = "(min-width: 1180px)";
// Narrow: only the back button still fits left of the tool row (iPad 11" portrait); below that it moves into the menu.
const BACK_FITS_QUERY = "(min-width: 780px)";

export type EditorChromeLayout = "wide" | "narrow" | "compact" | "mobile";

const getQuery = (query: string): MediaQueryList | null =>
  typeof window !== "undefined" && typeof window.matchMedia === "function"
    ? window.matchMedia(query)
    : null;

const useMediaQuery = (query: string): boolean => {
  const [matches, setMatches] = useState(
    () => getQuery(query)?.matches ?? false,
  );

  useEffect(() => {
    const mq = getQuery(query);
    if (!mq) return;
    const sync = () => setMatches(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, [query]);

  return matches;
};

type UseEditorChromeOptions = {
  drawingName: string;
};

export const useEditorChrome = ({ drawingName }: UseEditorChromeOptions) => {
  const isTouchOnly = useMediaQuery(TOUCH_ONLY_QUERY);
  const isMobile = useMediaQuery(MOBILE_QUERY);
  const isWide = useMediaQuery(WIDE_QUERY);
  const backFits = useMediaQuery(BACK_FITS_QUERY);
  const chromeLayout: EditorChromeLayout = isMobile
    ? "mobile"
    : isWide
      ? "wide"
      : backFits
        ? "narrow"
        : "compact";

  useEffect(() => {
    document.title = `${drawingName} - ExcaliDash`;
    return () => {
      document.title = "ExcaliDash";
    };
  }, [drawingName]);

  return { isTouchOnly, chromeLayout };
};
