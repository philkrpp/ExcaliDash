import { describe, expect, it } from "vitest";
import { anchorBelow, clampToViewport } from "../src/utils/clampToViewport";

const viewport = { width: 1440, height: 900 };

describe("clampToViewport", () => {
  it("keeps a position that already fits", () => {
    expect(
      clampToViewport({ x: 100, y: 100 }, { width: 192, height: 200 }, viewport),
    ).toEqual({ x: 100, y: 100 });
  });

  it("shifts a menu that would overflow right and bottom back inside", () => {
    expect(
      clampToViewport({ x: 1370, y: 850 }, { width: 192, height: 200 }, viewport),
    ).toEqual({ x: 1440 - 192 - 8, y: 900 - 200 - 8 });
  });

  it("never goes past the top-left margin, even when larger than the viewport", () => {
    expect(
      clampToViewport({ x: -20, y: 5 }, { width: 2000, height: 1000 }, viewport),
    ).toEqual({ x: 8, y: 8 });
  });
});

describe("anchorBelow", () => {
  it("right-aligns the menu just below its trigger", () => {
    expect(anchorBelow({ right: 300, bottom: 120 }, 192)).toEqual({
      x: 108,
      y: 124,
    });
  });
});
