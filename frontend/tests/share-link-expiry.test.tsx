import React from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ShareModal } from "../src/components/ShareModal";
import * as api from "../src/api";

vi.mock("react-dom", () => ({
  createPortal: (children: React.ReactNode) => children,
}));
vi.mock("../src/api", () => ({
  getDrawingSharing: vi.fn(async () => ({ permissions: [], linkShares: [] })),
  createLinkShare: vi.fn(async () => ({})),
  isAxiosError: () => false,
}));
vi.mock("../src/components/UserAvatar", () => ({ UserAvatar: () => null }));
vi.mock("../src/context/AuthContext", () => ({
  useAuth: () => ({ user: null }),
}));

const NOW = new Date("2026-11-24T10:00:00Z");
const DAY_MS = 24 * 60 * 60 * 1000;
const renderers: ReactTestRenderer[] = [];

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(NOW);
  vi.clearAllMocks();
  vi.stubGlobal(
    "window",
    Object.assign(new EventTarget(), {
      innerWidth: 1200,
      location: { origin: "https://example.test" },
    }),
  );
  vi.stubGlobal("document", { body: {}, title: "" });
  vi.stubGlobal("navigator", { clipboard: { writeText: vi.fn() } });
});

afterEach(() => {
  act(() => renderers.splice(0).forEach((r) => r.unmount()));
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

const renderModal = async () => {
  let renderer!: ReactTestRenderer;
  await act(async () => {
    renderer = create(
      <ShareModal
        drawingId="drawing"
        drawingName="Drawing"
        isOpen
        onClose={vi.fn()}
        anchorRef={{ current: null }}
      />,
    );
  });
  renderers.push(renderer);
  return renderer;
};

const withActiveLink = (expiresAt: string | null) =>
  vi.mocked(api.getDrawingSharing).mockResolvedValue({
    permissions: [],
    linkShares: [
      {
        id: "link",
        permission: "view",
        expiresAt,
        revokedAt: null,
      },
    ],
  } as never);

const lastLinkShareBody = () => {
  const calls = vi.mocked(api.createLinkShare).mock.calls;
  return calls[calls.length - 1][1];
};

// setDate(+30) works in local time; allow one hour for a DST switch.
const expectThirtyDays = (expiresAt: unknown) => {
  const ttl = Date.parse(String(expiresAt)) - NOW.getTime();
  expect(Math.abs(ttl - 30 * DAY_MS)).toBeLessThanOrEqual(60 * 60 * 1000);
};

describe("ShareModal link expiry", () => {
  it("creates a public link that stays valid for 30 days by default", async () => {
    const renderer = await renderModal();

    const access = renderer.root.findByProps({ ariaLabel: "Link access" });
    await act(async () => access.props.onChange("anyone"));

    expect(api.createLinkShare).toHaveBeenCalledOnce();
    const body = lastLinkShareBody();
    expect(body.permission).toBe("view");
    expectThirtyDays(body.expiresAt);
  });

  it("preselects 30 days again after the dialog is reopened", async () => {
    const renderer = await renderModal();
    const rerender = (isOpen: boolean) =>
      act(async () =>
        renderer.update(
          <ShareModal
            drawingId="drawing"
            drawingName="Drawing"
            isOpen={isOpen}
            onClose={vi.fn()}
            anchorRef={{ current: null }}
          />,
        ),
      );
    await rerender(false);
    await rerender(true);

    const access = renderer.root.findByProps({ ariaLabel: "Link access" });
    await act(async () => access.props.onChange("anyone"));

    expectThirtyDays(lastLinkShareBody().expiresAt);
  });

  it("keeps a never-expiring link when switching to editor", async () => {
    withActiveLink(null);
    const renderer = await renderModal();

    const permission = renderer.root.findByProps({
      ariaLabel: "Link permission",
    });
    await act(async () => permission.props.onChange("edit"));

    const body = lastLinkShareBody();
    expect(body.permission).toBe("edit");
    expect(body.expiresAt).toBeNull();
  });

  it("keeps a chosen expiry date when switching to editor", async () => {
    const chosen = new Date(NOW.getTime() + 60 * DAY_MS).toISOString();
    withActiveLink(chosen);
    const renderer = await renderModal();

    const permission = renderer.root.findByProps({
      ariaLabel: "Link permission",
    });
    await act(async () => permission.props.onChange("edit"));

    const body = lastLinkShareBody();
    expect(body.permission).toBe("edit");
    expect(body.expiresAt).toBe(chosen);
  });
});
