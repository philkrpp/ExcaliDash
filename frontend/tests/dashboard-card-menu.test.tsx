import React from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DrawingCardContextMenu } from "../src/components/drawing-card/DrawingCardContextMenu";

vi.mock("react-dom", () => ({
  createPortal: (children: React.ReactNode) => children,
}));

const drawing = {
  id: "d1",
  name: "Network",
  collectionId: null,
  version: 1,
  createdAt: 1,
  updatedAt: 1,
  accessLevel: "owner",
} as never;
const collections = [
  { id: "c1", name: "Workshops", createdAt: 1 },
] as never;

let renderer: ReactTestRenderer | undefined;
const render = async (
  position: { x: number; y: number },
  extra: {
    showMoveSubmenu?: boolean;
    onShowMoveSubmenu?: () => void;
    onClose?: () => void;
  } = {},
) => {
  await act(async () => {
    renderer = create(
      <DrawingCardContextMenu
        drawing={drawing}
        collections={collections}
        position={position}
        isTrash={false}
        isShared={false}
        storageAvailable={false}
        isExporting={false}
        exportError={null}
        showMoveSubmenu={extra.showMoveSubmenu ?? false}
        onShowMoveSubmenu={extra.onShowMoveSubmenu ?? vi.fn()}
        onClose={extra.onClose ?? vi.fn()}
        onRename={vi.fn()}
        onMoveToCollection={vi.fn()}
        onDuplicate={vi.fn()}
        onDelete={vi.fn()}
        onManageStorage={vi.fn()}
        onExport={vi.fn(async () => undefined)}
      />,
      {
        createNodeMock: (element) =>
          element.props["data-testid"] === "drawing-card-menu"
            ? {
                offsetWidth: 192,
                offsetHeight: 200,
                querySelector: () => firstItem,
                querySelectorAll: () => [firstItem],
                contains: () => false,
              }
            : element.props["data-testid"] === "drawing-card-move-to"
              ? { offsetTop: 44 }
              : null,
      },
    );
  });
  return renderer!;
};

const menu = () =>
  renderer!.root.findByProps({ "data-testid": "drawing-card-menu" });
const moveRow = () =>
  renderer!.root.findByProps({ "data-testid": "drawing-card-move-to" });

const firstItem = { focus: vi.fn() };
let keyListener: ((event: Partial<KeyboardEvent>) => void) | undefined;

beforeEach(() => {
  firstItem.focus.mockClear();
  keyListener = undefined;
  vi.stubGlobal("document", {
    body: {},
    activeElement: null,
    addEventListener: (type: string, listener: typeof keyListener) => {
      if (type === "keydown") keyListener = listener;
    },
    removeEventListener: vi.fn(),
  });
  vi.stubGlobal("window", {
    innerWidth: 1440,
    innerHeight: 900,
    setTimeout: vi.fn(),
    clearTimeout: vi.fn(),
  });
});
afterEach(async () => {
  await act(async () => renderer?.unmount());
  renderer = undefined;
  vi.unstubAllGlobals();
});

describe("drawing card menu placement", () => {
  it("keeps a menu that fits where it was opened", async () => {
    await render({ x: 100, y: 120 });
    expect(menu().props.style).toMatchObject({ left: 100, top: 120 });
  });

  it("clamps a menu opened at the right and bottom edge into the viewport", async () => {
    await render({ x: 1430, y: 880 });
    expect(menu().props.style).toMatchObject({
      left: 1440 - 192 - 8,
      top: 900 - 200 - 8,
    });
  });

  it("opens the submenu to the right while there is room", async () => {
    await render({ x: 100, y: 100 }, { showMoveSubmenu: true });
    const submenu = renderer!.root.findByProps({
      "data-testid": "drawing-card-move-submenu",
    });
    expect(submenu.props.className).toContain("left-full");
    expect(submenu.props.className).not.toContain("right-full");
  });

  it("opens the submenu to the left when there is no room on the right", async () => {
    await render({ x: 1300, y: 100 }, { showMoveSubmenu: true });
    const submenu = renderer!.root.findByProps({
      "data-testid": "drawing-card-move-submenu",
    });
    expect(submenu.props.className).toContain("right-full");
    expect(submenu.props.className).not.toContain("left-full");
  });
});

describe("drawing card menu submenu height", () => {
  const submenuClass = async (y: number) => {
    await render({ x: 100, y }, { showMoveSubmenu: true });
    return renderer!.root.findByProps({
      "data-testid": "drawing-card-move-submenu",
    }).props.className as string;
  };

  it("drops the submenu down while it fits below", async () => {
    expect(await submenuClass(100)).toContain("-top-1");
  });

  it("opens the submenu upwards near the bottom edge", async () => {
    // Menu clamped to y=692, move row at 692+44: 256px of submenu would not fit.
    const className = await submenuClass(880);
    expect(className).toContain("-bottom-1");
    expect(className).not.toContain("-top-1");
  });
});

describe("drawing card menu keyboard", () => {
  it("focuses the first item when it opens", async () => {
    await render({ x: 100, y: 100 });
    expect(firstItem.focus).toHaveBeenCalled();
  });

  it("closes on Escape", async () => {
    const onClose = vi.fn();
    await render({ x: 100, y: 100 }, { onClose });
    keyListener?.({
      key: "Escape",
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
    });
    expect(onClose).toHaveBeenCalled();
  });
});

describe("drawing card menu move-to on touch", () => {
  it("expands on tap instead of hover", async () => {
    const onShowMoveSubmenu = vi.fn();
    await render({ x: 100, y: 100 }, { onShowMoveSubmenu });
    const button = moveRow().findByType("button");
    await act(async () => button.props.onClick());
    expect(onShowMoveSubmenu).toHaveBeenCalledWith(true);
  });

  it("collapses on a second tap", async () => {
    const onShowMoveSubmenu = vi.fn();
    await render(
      { x: 100, y: 100 },
      { showMoveSubmenu: true, onShowMoveSubmenu },
    );
    await act(async () => moveRow().findAllByType("button")[0].props.onClick());
    expect(onShowMoveSubmenu).toHaveBeenCalledWith(false);
  });

  it("does not open from the emulated touch hover", async () => {
    const onShowMoveSubmenu = vi.fn();
    await render({ x: 100, y: 100 }, { onShowMoveSubmenu });
    await act(async () =>
      moveRow().props.onPointerEnter({ pointerType: "touch" }),
    );
    expect(onShowMoveSubmenu).not.toHaveBeenCalled();
  });

  it("still opens on mouse hover", async () => {
    const onShowMoveSubmenu = vi.fn();
    await render({ x: 100, y: 100 }, { onShowMoveSubmenu });
    await act(async () =>
      moveRow().props.onPointerEnter({ pointerType: "mouse" }),
    );
    expect(onShowMoveSubmenu).toHaveBeenCalledWith(true);
  });

  it("renders the collection list inline on touch devices", async () => {
    await render({ x: 100, y: 100 }, { showMoveSubmenu: true });
    const submenu = renderer!.root.findByProps({
      "data-testid": "drawing-card-move-submenu",
    });
    expect(submenu.props.className).toContain("[@media(hover:none)]:static");
    expect(
      submenu.findAllByProps({ "data-testid": "collection-option-c1" }).length,
    ).toBeGreaterThan(0);
  });
});
