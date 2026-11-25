import React from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Layout } from "../src/components/Layout";

vi.mock("react-router-dom", () => ({
  useLocation: () => ({ pathname: "/", search: "" }),
}));
vi.mock("../src/components/Sidebar", () => ({ Sidebar: () => null }));
vi.mock("../src/components/Logo", () => ({ Logo: () => null }));
vi.mock("../src/components/UploadStatus", () => ({ UploadStatus: () => null }));
vi.mock("../src/components/ImpersonationBanner", () => ({
  ImpersonationBanner: () => null,
}));
vi.mock("../src/components/UpdateBanner", () => ({ UpdateBanner: () => null }));

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

describe("Layout resize handle", () => {
  const layoutProps = {
    collections: [],
    selectedCollectionId: undefined,
    onSelectCollection: vi.fn(),
    onCreateCollection: vi.fn(),
    onEditCollection: vi.fn(),
    onDeleteCollection: vi.fn(),
  };
  const stubViewport = (isMobile: boolean) =>
    vi.stubGlobal("window", {
      matchMedia: () => ({
        matches: isMobile,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }),
    });

  for (const [name, isMobile] of [
    ["desktop", false],
    ["drawer", true],
  ] as const) {
    it(`is hidden on touch devices (${name})`, async () => {
      stubViewport(isMobile);
      const renderer = await render(
        <Layout {...layoutProps}>
          <p>content</p>
        </Layout>,
      );
      const handle = renderer.root.findAll(
        (node) =>
          node.type === "div" && node.props.title === "Drag to resize sidebar",
      );
      expect(handle).toHaveLength(1);
      expect(handle[0].props.className).toContain("[@media(hover:none)]:hidden");
    });
  }

  it("keeps 24px content padding from sm up instead of growing to lg:p-8", async () => {
    stubViewport(false);
    const renderer = await render(
      <Layout {...layoutProps}>
        <p>content</p>
      </Layout>,
    );
    const html = JSON.stringify(renderer.toJSON());
    expect(html).toContain("sm:p-6");
    expect(html).not.toContain("lg:p-8");
  });
});

