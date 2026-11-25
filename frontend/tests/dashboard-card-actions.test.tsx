import React from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DrawingCard } from "../src/components/DrawingCard";

let menuProps: Record<string, unknown> | null = null;

vi.mock("../src/api", () => ({
  isS3Enabled: vi.fn(async () => false),
}));
vi.mock("../src/components/drawing-card/useDrawingPreview", () => ({
  useDrawingPreview: () => ({ previewSvg: null }),
}));
vi.mock("../src/components/drawing-card/DrawingCardContextMenu", () => ({
  DRAWING_MENU_WIDTH: 192,
  DrawingCardContextMenu: (props: Record<string, unknown>) => {
    menuProps = props;
    return null;
  },
}));
vi.mock("../src/components/drawing-card/CollectionPicker", () => ({
  CollectionPicker: () => null,
}));
vi.mock("../src/components/StorageManageModal", () => ({
  StorageManageModal: () => null,
}));

const drawing = {
  id: "d1",
  name: "Network",
  collectionId: null,
  version: 1,
  createdAt: 1,
  updatedAt: 1,
  preview: null,
  accessLevel: "owner",
} as never;

let renderer: ReactTestRenderer | undefined;
const render = async (isSelected = false) => {
  await act(async () => {
    renderer = create(
      <DrawingCard
        drawing={drawing}
        collections={[]}
        isSelected={isSelected}
        onToggleSelection={vi.fn()}
        onRename={vi.fn()}
        onDelete={vi.fn()}
        onMoveToCollection={vi.fn()}
        onDuplicate={vi.fn()}
        onClick={vi.fn()}
      />,
    );
  });
  return renderer!;
};

beforeEach(() => {
  menuProps = null;
  vi.stubGlobal("document", {
    body: {},
    title: "",
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  });
});
afterEach(async () => {
  await act(async () => renderer?.unmount());
  renderer = undefined;
  vi.unstubAllGlobals();
});

describe("drawing card actions button", () => {
  const actionsButton = () =>
    renderer!.root.findByProps({ "data-testid": "drawing-actions-d1" });

  it("is labelled with the drawing name and has a 44px hit area", async () => {
    await render();
    expect(actionsButton().props["aria-label"]).toBe(
      'More actions for "Network"',
    );
    expect(actionsButton().props.className).toContain("h-11");
    expect(actionsButton().props.className).toContain("w-11");
  });

  it("opens the card menu anchored at the button, not at the pointer", async () => {
    await render();
    expect(menuProps).toBeNull();
    const stopPropagation = vi.fn();
    await act(async () => {
      actionsButton().props.onClick({
        stopPropagation,
        currentTarget: {
          getBoundingClientRect: () => ({
            left: 300,
            right: 344,
            top: 500,
            bottom: 544,
          }),
        },
      });
    });
    expect(stopPropagation).toHaveBeenCalled();
    expect(menuProps?.position).toEqual({ x: 344 - 192, y: 544 + 4 });
  });
});

describe("drawing card selection circle", () => {
  const circleWrapper = () =>
    renderer!.root.findByProps({ "data-testid": "select-drawing-d1" }).parent!;

  it("stays visible on touch devices, semi-transparent when unselected", async () => {
    await render(false);
    const className = circleWrapper().props.className as string;
    expect(className).toContain("[@media(hover:none)]:opacity-70");
    expect(circleWrapper().props.style).toEqual({ opacity: undefined });
  });

  it("is fully opaque when selected", async () => {
    await render(true);
    expect(circleWrapper().props.style).toEqual({ opacity: 1 });
  });

  it("has a 44px hit area around a 28px touch circle", async () => {
    await render();
    const button = renderer!.root.findByProps({
      "data-testid": "select-drawing-d1",
    });
    expect(button.props.className).toContain("[@media(hover:none)]:h-11");
    expect(button.props.className).toContain("[@media(hover:none)]:w-11");
    const circle = button.findByType("span");
    expect(circle.props.className).toContain("[@media(hover:none)]:h-7");
    expect(circle.props.className).toContain("[@media(hover:none)]:w-7");
  });
});
