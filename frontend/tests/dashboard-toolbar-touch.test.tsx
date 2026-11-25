import React from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DashboardToolbar } from "../src/pages/dashboard/DashboardToolbar";
import { DrawingsGrid } from "../src/pages/dashboard/DashboardPanels";
import { CollectionPicker } from "../src/components/drawing-card/CollectionPicker";

vi.mock("../src/context/AuthContext", () => ({
  useAuth: () => ({ user: null }),
}));
vi.mock("../src/components/DrawingCard", () => ({ DrawingCard: () => null }));

let renderer: ReactTestRenderer | undefined;
afterEach(async () => {
  await act(async () => renderer?.unmount());
  renderer = undefined;
});

const toolbar = async (
  hasSelection: boolean,
  onClearSelection: () => void = vi.fn(),
) => {
  await act(async () => {
    renderer = create(
      <DashboardToolbar
        search=""
        searchInputRef={{ current: null }}
        sortConfig={{ field: "updatedAt", direction: "desc" }}
        sortOptions={[
          { field: "updatedAt", label: "Date Modified", icon: null },
        ]}
        sortedDrawingsCount={3}
        allSelected={false}
        hasSelection={hasSelection}
        isTrashView={false}
        isSharedView={false}
        isSharedCollection={false}
        showBulkMoveMenu={false}
        selectedCount={hasSelection ? 2 : 0}
        collections={[]}
        onSearchChange={vi.fn()}
        onSortFieldChange={vi.fn()}
        onSortDirectionToggle={vi.fn()}
        onSelectAll={vi.fn()}
        onClearSelection={onClearSelection}
        onBulkDeleteClick={vi.fn()}
        onBulkDuplicate={vi.fn()}
        onShowBulkMoveMenuChange={vi.fn()}
        onBulkMove={vi.fn()}
        onImportDrawings={vi.fn()}
        onCreateDrawing={vi.fn()}
        onViewerActionError={vi.fn()}
      />,
    );
  });
  return renderer!.root;
};

const selectionRow = (root: ReturnType<typeof create>["root"]) =>
  root.findByProps({ role: "group", "aria-label": "Selection" }).parent!;

describe("dashboard toolbar on phones (D5)", () => {
  it("hides the selection group below md while nothing is selected", async () => {
    const root = await toolbar(false);
    const className = selectionRow(root).props.className as string;
    expect(className.split(" ")).toContain("hidden");
    expect(className.split(" ")).toContain("md:flex");
  });

  it("shows the selection group as its own full-width row, with the count, once something is selected", async () => {
    const root = await toolbar(true);
    const classes = (selectionRow(root).props.className as string).split(" ");
    expect(classes).not.toContain("hidden");
    expect(classes).toContain("max-md:w-full");
    expect(classes).toContain("max-md:order-last");
    expect(JSON.stringify(renderer!.toJSON())).toContain("selected");
  });

  it("offers a phone-only ✕ that clears the selection", async () => {
    const onClearSelection = vi.fn();
    const root = await toolbar(true, onClearSelection);
    const clear = root.findByProps({ "aria-label": "Clear selection" });
    expect(clear.props.className).toContain("md:hidden");
    clear.props.onClick();
    expect(onClearSelection).toHaveBeenCalled();
  });

  it("shows import and new as icon-only buttons below md", async () => {
    const root = await toolbar(false);
    const importButton = root.findByProps({ "aria-label": "Import drawings" });
    const newButton = root.findByProps({ "aria-label": "New drawing" });
    expect(importButton.props.className).toContain("w-[42px]");
    expect(newButton.props.className).toContain("w-[42px]");
    expect(importButton.props.className).not.toContain("flex-1");
    expect(newButton.props.className).not.toContain("flex-1");
  });
});

describe("search shortcut hint (D7)", () => {
  it("is hidden on devices without hover", async () => {
    const root = await toolbar(false);
    expect(root.findByType("kbd").props.className).toContain(
      "[@media(hover:none)]:!hidden",
    );
  });
});

describe("dashboard grid density (D3)", () => {
  it("uses 280px columns below md and 220px columns from md", async () => {
    await act(async () => {
      renderer = create(
        <DrawingsGrid
          drawings={[]}
          collections={[]}
          selectedIds={new Set()}
          emptySearch=""
          isLoading={false}
          isDraggingFile={false}
          isTrashView={false}
          isSharedView={false}
          isSharedCollection={false}
          onClearSearch={vi.fn()}
          onToggleSelection={vi.fn()}
          onRename={vi.fn()}
          onDelete={vi.fn()}
          onHide={vi.fn()}
          onDuplicate={vi.fn()}
          onMoveToCollection={vi.fn()}
          onClick={vi.fn()}
          onDragStart={vi.fn()}
          onDragEnd={vi.fn()}
          onPreviewReady={vi.fn(() => () => undefined)}
        />,
      );
    });
    const className = renderer!.root.findByType("div").props.className as string;
    expect(className).toContain(
      "grid-cols-[repeat(auto-fill,minmax(280px,1fr))]",
    );
    expect(className).toContain(
      "md:grid-cols-[repeat(auto-fill,minmax(220px,1fr))]",
    );
  });
});

describe("collection chip on touch (D6)", () => {
  it("grows its hit area to at least 44px without changing its look", async () => {
    await act(async () => {
      renderer = create(
        <CollectionPicker
          drawing={{ id: "d1", collectionId: null } as never}
          collections={[]}
          isShared={false}
          isSharedCollection={false}
          isOpen={false}
          onToggle={vi.fn()}
          onClose={vi.fn()}
          onMoveToCollection={vi.fn()}
        />,
      );
    });
    const chip = renderer!.root.findByProps({
      "data-testid": "collection-picker-d1",
    });
    const className = chip.props.className as string;
    expect(className).toContain("[@media(hover:none)]:before:absolute");
    expect(className).toContain("[@media(hover:none)]:before:-inset-y-[11px]");
    // A truncating chip would clip the pseudo-element, so truncation lives on an inner span.
    expect(className).not.toContain("truncate");
  });
});
