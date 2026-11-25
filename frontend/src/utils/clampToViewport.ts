type Point = { x: number; y: number };
type Size = { width: number; height: number };

/** Moves a floating element's top-left corner so the whole element stays `margin` px inside the viewport. */
export const clampToViewport = (
  position: Point,
  size: Size,
  viewport: Size,
  margin = 8,
): Point => ({
  x: Math.max(margin, Math.min(position.x, viewport.width - size.width - margin)),
  y: Math.max(
    margin,
    Math.min(position.y, viewport.height - size.height - margin),
  ),
});

/** Top-left corner for a menu right-aligned just below its trigger button. */
export const anchorBelow = (
  trigger: { right: number; bottom: number },
  menuWidth: number,
  gap = 4,
): Point => ({ x: trigger.right - menuWidth, y: trigger.bottom + gap });
