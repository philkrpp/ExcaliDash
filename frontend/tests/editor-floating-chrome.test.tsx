import React, { useEffect } from "react";
import {
  act,
  create,
  type ReactTestInstance,
  type ReactTestRenderer,
} from "react-test-renderer";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { EditorView } from "../src/pages/editor/EditorView";
import {
  useEditorChrome,
  type EditorChromeLayout,
} from "../src/pages/editor/useEditorChrome";

vi.mock("@excalidraw/excalidraw", () => {
  const Item = ({ children }: { children: React.ReactNode }) => <>{children}</>;
  return {
    Excalidraw: (props: Record<string, unknown>) =>
      React.createElement("mock-canvas", props),
    MainMenu: Object.assign(Item, {
      Item,
      ItemCustom: Item,
      Separator: () => null,
      DefaultItems: {
        SaveAsImage: () => null,
        ClearCanvas: () => null,
        ChangeCanvasBackground: () => null,
        Help: () => null,
      },
    }),
  };
});
vi.mock("../src/components/ShareModal", () => ({ ShareModal: () => null }));
vi.mock("../src/components/LanguageSelector", () => ({
  LanguageSelector: () => null,
}));
vi.mock("../src/components/GridStepSelector", () => ({
  GridStepSelector: () => null,
}));
vi.mock("../src/components/UserAvatar", () => ({ UserAvatar: () => null }));
vi.mock("sonner", () => ({ Toaster: () => null }));

const renderers: ReactTestRenderer[] = [];
async function render(node: React.ReactElement) {
  let renderer!: ReactTestRenderer;
  await act(async () => {
    renderer = create(node);
  });
  renderers.push(renderer);
  return renderer;
}

afterEach(() => {
  act(() => renderers.splice(0).forEach((r) => r.unmount()));
  vi.unstubAllGlobals();
});

const ref = <T,>(current: T | null = null) => ({ current });

function view(overrides: Record<string, unknown> = {}) {
  const props = {
    id: "drawing",
    accessLevel: "owner",
    canEdit: true,
    autosaveFailing: false,
    drawingName: "Projektplanung Q1",
    editorContainerRef: ref(),
    initialData: { elements: [] },
    isHistoryOpen: false,
    historyPreview: null,
    historyButtonRef: ref<HTMLButtonElement>(),
    shareButtonRef: ref<HTMLButtonElement>(),
    isRenaming: false,
    isSavingOnLeave: false,
    isSceneLoading: false,
    isTouchOnly: false,
    chromeLayout: "wide" as EditorChromeLayout,
    langCode: "en",
    loadError: null,
    me: { id: "me", name: "Me", color: "red" },
    newName: "Projektplanung Q1",
    peers: [],
    followedUserId: null,
    onToggleFollow: vi.fn(),
    theme: "light",
    gridStep: 20,
    isShareOpen: false,
    onBackClick: vi.fn(),
    onBackIntent: vi.fn(),
    onCanvasChange: vi.fn(),
    onCanvasDropCapture: vi.fn(),
    onExportClick: vi.fn(),
    onLibraryChange: vi.fn(),
    onNavigateHome: vi.fn(),
    onNewNameChange: vi.fn(),
    onPointerUpdate: vi.fn(),
    onRenameCancel: vi.fn(),
    onRenameStart: vi.fn(),
    onRenameSubmit: vi.fn(),
    onSetExcalidrawAPI: vi.fn(),
    onSetLangCode: vi.fn(),
    onSetGridStep: vi.fn(),
    onShareOpen: vi.fn(),
    onCloseShare: vi.fn(),
    onHistoryOpen: vi.fn(),
    onToggleTheme: vi.fn(),
    ...overrides,
  };
  return { props, element: <EditorView {...(props as never)} /> };
}

const byLabel = (root: ReactTestInstance, label: string) =>
  root.findAll(
    (node) => node.type === "button" && node.props["aria-label"] === label,
  );

// Renders what Excalidraw would place in its top-right slot.
async function topRight(renderer: ReactTestRenderer, isMobile: boolean) {
  const canvas = renderer.root.findByType("mock-canvas" as React.ElementType);
  const slot = canvas.props.renderTopRightUI(isMobile, {});
  return slot ? render(slot) : null;
}

describe("editor floating chrome", () => {
  beforeEach(() => {
    vi.stubGlobal("window", {
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });
  });

  it("has no fixed header and gives the canvas the full viewport height", async () => {
    const renderer = await render(view().element);
    expect(renderer.root.findAllByType("header")).toHaveLength(0);
    const container = renderer.root.findAll(
      (node) => node.type === "div" && node.props.onDropCapture,
    )[0];
    expect(container.props.style).toBeUndefined();
    expect(container.props.className).toContain("h-full");
  });

  it("wide: back + title island left, actions in Excalidraw's top-right slot", async () => {
    const { element, props } = view();
    const renderer = await render(element);
    expect(byLabel(renderer.root, "Back to dashboard")).toHaveLength(1);
    expect(renderer.root.findByType("h1").children).toEqual([
      "Projektplanung Q1",
    ]);
    const slot = await topRight(renderer, false);
    expect(slot).not.toBeNull();
    const history = byLabel(slot!.root, "Version history")[0];
    const share = byLabel(slot!.root, "Share")[0];
    const exportButton = byLabel(slot!.root, "Export drawing")[0];
    await act(async () => {
      history.props.onClick();
      share.props.onClick();
      exportButton.props.onClick();
    });
    expect(props.onHistoryOpen).toHaveBeenCalledOnce();
    expect(props.onShareOpen).toHaveBeenCalledOnce();
    expect(props.onExportClick).toHaveBeenCalledOnce();
    expect(byLabel(renderer.root, "More actions")).toHaveLength(0);
  });

  it("wide: unsaved and read-only badges sit in the right island", async () => {
    const { element } = view({ autosaveFailing: true });
    const slot = await topRight(await render(element), false);
    expect(JSON.stringify(slot!.toJSON())).toContain("Unsaved changes");
    const readOnly = view({ canEdit: false, accessLevel: "view" });
    const slot2 = await topRight(await render(readOnly.element), false);
    expect(JSON.stringify(slot2!.toJSON())).toContain("Read-only");
  });

  it("narrow: back stays top-left, actions fold into a bottom-right menu", async () => {
    const { element, props } = view({ chromeLayout: "narrow" });
    const renderer = await render(element);
    expect(await topRight(renderer, false)).toBeNull();
    expect(byLabel(renderer.root, "Back to dashboard")).toHaveLength(1);
    expect(renderer.root.findAllByType("h1")).toHaveLength(0);
    const more = byLabel(renderer.root, "More actions")[0];
    await act(async () => more.props.onClick());
    const items = renderer.root.findAll(
      (node) => node.type === "button" && node.props.role === "menuitem",
    );
    expect(items.map((item) => item.props["data-action"])).toEqual([
      "rename",
      "history",
      "share",
      "export",
    ]);
    await act(async () => items[2].props.onClick());
    expect(props.onShareOpen).toHaveBeenCalledOnce();
    // Popovers fall back to their default top-right position without an anchor.
    expect(props.shareButtonRef.current).toBeNull();
  });

  it("narrow-compact: back moves into the menu when the tool row leaves no room", async () => {
    const { element, props } = view({ chromeLayout: "compact" });
    const renderer = await render(element);
    expect(
      renderer.root.findAll(
        (node) =>
          node.type === "button" &&
          node.props["aria-label"] === "Back to dashboard" &&
          node.props.role !== "menuitem",
      ),
    ).toHaveLength(0);
    await act(async () =>
      byLabel(renderer.root, "More actions")[0].props.onClick(),
    );
    const back = renderer.root.find(
      (node) => node.props["data-action"] === "back",
    );
    await act(async () => back.props.onClick());
    expect(props.onBackClick).toHaveBeenCalledOnce();
  });

  it("closes the menu on a second tap of … and on Escape", async () => {
    const listeners: Record<string, (event: { key: string }) => void> = {};
    vi.stubGlobal("window", {
      addEventListener: (type: string, fn: (event: { key: string }) => void) =>
        (listeners[type] = fn),
      removeEventListener: vi.fn(),
    });
    const renderer = await render(view({ chromeLayout: "narrow" }).element);
    const more = () => byLabel(renderer.root, "More actions")[0];
    const menus = () => renderer.root.findAll((n) => n.props.role === "menu");
    await act(async () => more().props.onClick());
    expect(menus()).toHaveLength(1);
    expect(more().props.className).toContain("z-10");
    await act(async () => more().props.onClick());
    expect(menus()).toHaveLength(0);
    await act(async () => more().props.onClick());
    await act(async () => listeners.keydown({ key: "Escape" }));
    expect(menus()).toHaveLength(0);
  });

  it("rename from the menu keeps the menu open with the name field", async () => {
    const { element, props } = view({ chromeLayout: "narrow" });
    const renderer = await render(element);
    await act(async () =>
      byLabel(renderer.root, "More actions")[0].props.onClick(),
    );
    const rename = renderer.root.find(
      (node) => node.props["data-action"] === "rename",
    );
    await act(async () => rename.props.onClick());
    expect(props.onRenameStart).toHaveBeenCalledOnce();
    await act(async () =>
      renderer.update(
        <EditorView
          {...(view({ chromeLayout: "narrow", isRenaming: true })
            .props as never)}
        />,
      ),
    );
    expect(
      renderer.root.findAll(
        (node) =>
          node.type === "input" && node.props["aria-label"] === "Drawing name",
      ),
    ).toHaveLength(1);
  });

  it("mobile: Excalidraw's full top row stays untouched, the menu sits above its bottom bar", async () => {
    const renderer = await render(view({ chromeLayout: "mobile" }).element);
    expect(await topRight(renderer, true)).toBeNull();
    expect(byLabel(renderer.root, "Back to dashboard")).toHaveLength(0);
    const more = byLabel(renderer.root, "More actions");
    expect(more).toHaveLength(1);
    const anchor = renderer.root.find(
      (node) =>
        node.type === "div" &&
        typeof node.props.className === "string" &&
        node.props.className.includes("bottom-[72px]"),
    );
    expect(
      anchor.findAllByProps({ "aria-label": "More actions" }),
    ).not.toHaveLength(0);
    await act(async () => more[0].props.onClick());
    expect(
      renderer.root.findAll((node) => node.props["data-action"] === "back"),
    ).toHaveLength(1);
  });
});

describe("useEditorChrome layout", () => {
  let layout: EditorChromeLayout | undefined;
  const Probe = () => {
    const { chromeLayout } = useEditorChrome({ drawingName: "D" });
    useEffect(() => {
      layout = chromeLayout;
    }, [chromeLayout]);
    return null;
  };

  const stub = (width: number, height: number) => {
    vi.stubGlobal("document", { title: "" });
    vi.stubGlobal("window", {
      matchMedia: (query: string) => ({
        // Minimal evaluator for the queries the hook uses.
        matches: query.split(",").some((part) =>
          [...part.matchAll(/\((max|min)-(width|height):\s*([\d.]+)px\)/g)]
            .map(([, kind, dim, px]) => {
              const value = dim === "width" ? width : height;
              return kind === "max" ? value <= +px : value >= +px;
            })
            .every(Boolean),
        ),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }),
    });
  };

  it.each([
    [1194, 834, "wide"],
    [1440, 900, "wide"],
    [834, 1194, "narrow"],
    [744, 1133, "compact"],
    [390, 844, "mobile"],
    [844, 390, "mobile"],
  ])("%ix%i → %s", async (width, height, expected) => {
    stub(width, height);
    await render(<Probe />);
    expect(layout).toBe(expected);
  });
});
