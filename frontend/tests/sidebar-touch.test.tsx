import React from "react";
import {
  act,
  create,
  type ReactTestInstance,
  type ReactTestRenderer,
} from "react-test-renderer";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Sidebar } from "../src/components/Sidebar";
import { SidebarFooter } from "../src/components/sidebar/SidebarFooter";
import { translate } from "../src/i18n";

const portalTargets = vi.hoisted(() => [] as unknown[]);
vi.mock("react-dom", async (importOriginal) => ({
  ...(await importOriginal<typeof import("react-dom")>()),
  createPortal: (children: React.ReactNode, target: unknown) => {
    portalTargets.push(target);
    return children;
  },
}));
vi.mock("react-router-dom", () => ({
  useNavigate: () => vi.fn(),
}));
vi.mock("../src/context/useLocale", () => ({
  useLocale: () => ({
    t: (
      key: Parameters<typeof translate>[1],
      params?: Parameters<typeof translate>[2],
    ) => translate("en", key, params),
  }),
}));
vi.mock("../src/context/AuthContext", () => ({
  useAuth: () => ({
    logout: vi.fn(),
    user: { name: "Philipp", email: "p@example.com", role: "ADMIN" },
    authEnabled: true,
  }),
}));
vi.mock("../src/context/PreferencesContext", () => ({
  usePreference: (_key: string, fallback: unknown) => [fallback, vi.fn()],
}));
vi.mock("../src/components/ConfirmModal", () => ({ ConfirmModal: () => null }));
vi.mock("../src/components/ShareCollectionModal", () => ({
  ShareCollectionModal: () => null,
}));
vi.mock("../src/components/Logo", () => ({ Logo: () => null }));
vi.mock("../src/components/UserAvatar", () => ({ UserAvatar: () => null }));

const renderers: ReactTestRenderer[] = [];
async function render(node: React.ReactElement) {
  let renderer!: ReactTestRenderer;
  await act(async () => {
    renderer = create(node);
  });
  renderers.push(renderer);
  return renderer;
}

const collect = (node: ReactTestInstance | string): string =>
  typeof node === "string" ? node : node.children.map(collect).join("|");
const text = (node: ReactTestInstance | ReactTestRenderer): string =>
  "root" in node ? JSON.stringify(node.toJSON()) : collect(node);

afterEach(() => {
  act(() => renderers.splice(0).forEach((r) => r.unmount()));
  vi.unstubAllGlobals();
});

beforeEach(() => {
  vi.stubGlobal("document", {
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  });
});

describe("SidebarFooter active page", () => {
  const footer = (selectedCollectionId: string | null | undefined) => (
    <SidebarFooter
      selectedCollectionId={selectedCollectionId}
      authEnabled
      user={{ name: "Philipp", email: "p@example.com", role: "ADMIN" }}
      onLogout={vi.fn()}
    />
  );
  const account = (renderer: ReactTestRenderer) =>
    renderer.root.findByProps({ "aria-label": "Account menu" });

  it("shows the page name next to the user name and highlights the button on Settings", async () => {
    const renderer = await render(footer("SETTINGS"));
    const button = account(renderer);
    expect(text(button)).toContain("Philipp");
    expect(text(button)).toContain("Settings");
    expect(button.props["aria-current"]).toBe("page");
    expect(button.props.className).toContain("bg-indigo-50");
  });

  it("names Profile and Admin pages too", async () => {
    for (const [id, label] of [
      ["PROFILE", "Profile"],
      ["ADMIN", "Admin"],
    ]) {
      const renderer = await render(footer(id));
      expect(text(account(renderer))).toContain(label);
    }
  });

  it("is neutral on library views", async () => {
    const renderer = await render(footer(undefined));
    const button = account(renderer);
    expect(button.props["aria-current"]).toBeUndefined();
    expect(text(button)).not.toContain("Settings");
    expect(button.props.className).not.toContain("bg-indigo-50");
  });

  it("no longer carries a Trash entry (it lives in the Library)", async () => {
    const renderer = await render(footer("trash"));
    expect(text(renderer)).not.toContain("Trash");
  });
});

describe("Sidebar", () => {
  const collection = (extra: Record<string, unknown> = {}) => ({
    id: "c1",
    name: "Garden",
    isOwner: true,
    ...extra,
  });
  const sidebar = (
    overrides: Record<string, unknown> = {},
    collections: unknown[] = [collection()],
  ) => {
    const props = {
      collections,
      selectedCollectionId: undefined,
      onSelectCollection: vi.fn(),
      onCreateCollection: vi.fn(),
      onEditCollection: vi.fn(),
      onDeleteCollection: vi.fn(),
      onDrop: vi.fn(),
      ...overrides,
    };
    return { props, element: <Sidebar {...(props as never)} /> };
  };
  const menuButton = (renderer: ReactTestRenderer) =>
    renderer.root.findAll(
      (node) =>
        node.type === "button" &&
        node.props["aria-label"] === "Actions for Garden",
    )[0];

  it("opens the collection menu from the trailing ⋯ button, anchored at the button", async () => {
    const renderer = await render(sidebar().element);
    const button = menuButton(renderer);
    expect(button).toBeDefined();
    expect(button.props.className).toContain("[@media(hover:none)]:opacity-100");
    expect(button.props.className).toContain("[@media(hover:none)]:h-11");
    expect(text(renderer)).not.toContain("Share Collection");
    const stopPropagation = vi.fn();
    await act(async () =>
      button.props.onClick({
        stopPropagation,
        currentTarget: {
          getBoundingClientRect: () => ({ right: 250, bottom: 100 }),
        },
      }),
    );
    expect(stopPropagation).toHaveBeenCalled();
    const json = text(renderer);
    expect(json).toContain("Share Collection");
    expect(json).toContain("Rename Collection");
    expect(json).toContain("Delete Collection");
    // Portaled so the transformed, overflow-hidden mobile drawer can't clip it.
    expect(portalTargets.at(-1)).toBe(document.body);
  });

  it("does not offer ⋯ for collections shared with me", async () => {
    const renderer = await render(
      sidebar({}, [collection({ isOwner: false, sharedRole: "view" })]).element,
    );
    expect(menuButton(renderer)).toBeUndefined();
  });

  it("keeps the ⋯ button outside the row button (no nested interactive)", async () => {
    const renderer = await render(sidebar().element);
    let node = menuButton(renderer).parent;
    while (node) {
      expect(node.props?.role).not.toBe("button");
      node = node.parent;
    }
  });

  it("makes the + button a 44px touch target at full opacity", async () => {
    const renderer = await render(sidebar().element);
    const plus = renderer.root.findAll(
      (node) =>
        node.type === "button" && node.props["aria-label"] === "New Collection",
    )[0];
    expect(plus.props.className).toContain("[@media(hover:none)]:h-11");
    expect(plus.props.className).toContain("[@media(hover:none)]:w-11");
    expect(plus.props.className).toContain("[@media(hover:none)]:opacity-100");
  });

  const libraryRow = (renderer: ReactTestRenderer, label: string) =>
    renderer.root.findAll(
      (node) =>
        node.props.role === "button" &&
        text(node).includes(label) &&
        typeof node.props.onClick === "function" &&
        node.type === "div",
    )[0];

  it("renders Trash in the Library as a permanent drop target", async () => {
    const { element, props } = sidebar();
    const renderer = await render(element);
    const html = text(renderer);
    expect(html.indexOf('"Unorganized"')).toBeLessThan(html.indexOf('"Trash"'));
    expect(html.indexOf('"Trash"')).toBeLessThan(html.indexOf('"Collections"'));
    const row = libraryRow(renderer, "Trash");
    await act(async () => row.props.onClick());
    expect(props.onSelectCollection).toHaveBeenCalledWith("trash");
    const event = { preventDefault: vi.fn() };
    await act(async () => row.props.onDrop(event));
    expect(props.onDrop).toHaveBeenCalledWith(event, "trash");
  });

  it("marks Trash active when selected", async () => {
    const renderer = await render(
      sidebar({ selectedCollectionId: "trash" }).element,
    );
    expect(libraryRow(renderer, "Trash").props.className).toContain(
      "bg-indigo-50",
    );
    const idle = await render(sidebar().element);
    expect(libraryRow(idle, "Trash").props.className).not.toContain(
      "bg-indigo-50",
    );
  });

  it("uses 44px rows on touch and readable section labels", async () => {
    const renderer = await render(sidebar().element);
    const row = libraryRow(renderer, "Garden");
    expect(row.props.className).toContain("[@media(hover:none)]:py-2.5");
    const labels = renderer.root.findAll(
      (node) =>
        (node.type === "span" || node.type === "div") &&
        (node.children as unknown[]).some(
          (child) => child === "Library" || child === "Collections",
        ),
    );
    expect(labels).toHaveLength(2);
    for (const label of labels) {
      expect(label.props.className).toContain("text-slate-500");
      expect(label.props.className).toContain("dark:text-neutral-400");
      expect(label.props.className).not.toContain("text-slate-400");
    }
  });
});
