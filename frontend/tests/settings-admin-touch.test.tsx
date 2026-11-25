import React from "react";
import {
  act,
  create,
  type ReactTestInstance,
  type ReactTestRenderer,
} from "react-test-renderer";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PlayfulSwitch } from "../src/components/PlayfulSwitch";
import { SettingsMainGrid } from "../src/pages/settings/SettingsMainGrid";
import { SettingsRow } from "../src/pages/settings/SettingsRow";
import { LoginRateLimitCard } from "../src/pages/admin/LoginRateLimitCard";
import { UsersTable } from "../src/pages/admin/UsersTable";
import { PasswordCard } from "../src/pages/profile/PasswordCard";
import type { AdminUser } from "../src/pages/admin/types";

const locale = vi.hoisted(() => ({ language: "en" }));
vi.mock("../src/context/useLocale", () => ({
  useLocale: () => ({
    language: locale.language,
    setLanguage: vi.fn(),
    t: (key: string) => key,
  }),
}));
vi.mock("../src/pages/settings/UpdateSettingsCard", () => ({
  UpdateSettingsCard: () => null,
}));
vi.mock("react-router-dom", () => ({ useNavigate: () => vi.fn() }));
vi.mock("../src/components/ConfirmModal", () => ({
  ConfirmModal: (props: Record<string, unknown>) =>
    props.isOpen ? React.createElement("mock-confirm", props) : null,
}));

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
  locale.language = "en";
});

const text = (renderer: ReactTestRenderer) => JSON.stringify(renderer.toJSON());
const byLabel = (root: ReactTestInstance, label: string) =>
  root.findAll(
    (node) => node.type === "button" && node.props["aria-label"] === label,
  );
const clickFrom = (target: { closest: () => unknown }) => ({ target });

describe("PlayfulSwitch touch size", () => {
  it("grows to 52x30 on (hover: none) only", async () => {
    const r = await render(
      <PlayfulSwitch checked={false} onChange={vi.fn()} ariaLabel="x" />,
    );
    const cls = r.root.findByType("button").props.className as string;
    expect(cls).toContain("[@media(hover:none)]:h-[30px]");
    expect(cls).toContain("[@media(hover:none)]:w-[52px]");
    expect(cls).toContain("h-6 w-11");
  });
});

describe("SettingsRow toggle", () => {
  it("toggles once when the row is clicked", async () => {
    const onToggle = vi.fn();
    const r = await render(
      <SettingsRow title="Row" onToggle={onToggle}>
        <PlayfulSwitch checked={false} onChange={vi.fn()} ariaLabel="x" />
      </SettingsRow>,
    );
    const row = r.root.findAll(
      (n) => n.type === "div" && typeof n.props.onClick === "function",
    )[0];
    act(() => row.props.onClick(clickFrom({ closest: () => null })));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it("does not double toggle when the click comes from the switch itself", async () => {
    const onToggle = vi.fn();
    const r = await render(
      <SettingsRow title="Row" onToggle={onToggle}>
        <PlayfulSwitch checked={false} onChange={vi.fn()} ariaLabel="x" />
      </SettingsRow>,
    );
    const row = r.root.findAll(
      (n) => n.type === "div" && typeof n.props.onClick === "function",
    )[0];
    act(() => row.props.onClick(clickFrom({ closest: () => ({}) })));
    expect(onToggle).not.toHaveBeenCalled();
  });

  it("is not clickable without onToggle", async () => {
    const r = await render(<SettingsRow title="Row" />);
    expect(
      r.root.findAll(
        (n) => n.type === "div" && typeof n.props.onClick === "function",
      ),
    ).toHaveLength(0);
  });
});

const gridProps = {
  exportBackup: vi.fn(),
  theme: "light" as const,
  themePreference: "system" as const,
  onThemePreferenceChange: vi.fn(),
  imageCompression: true,
  toggleImageCompression: vi.fn(),
  imageCompressionThresholdMb: 1,
  onImageCompressionThresholdChange: vi.fn(),
  compactSidebar: true,
  onCompactSidebarChange: vi.fn(),
  appendDroppedDrawings: false,
  onAppendDroppedDrawingsChange: vi.fn(),
  updateChannel: "stable" as const,
  updateInfo: null,
  updateLoading: false,
  updateError: null,
  onUpdateChannelChange: vi.fn(),
  onCheckForUpdates: vi.fn(),
};

describe("SettingsMainGrid", () => {
  it("names the extra language entry with the language name", async () => {
    locale.language = "de-DE";
    const r = await render(<SettingsMainGrid {...gridProps} />);
    expect(text(r)).not.toContain("editor language");
    const select = r.root.findAll(
      (n) =>
        Array.isArray(n.props.options) &&
        n.props.ariaLabel === "settings.language",
    )[0];
    expect(select.props.options).toContainEqual({
      value: "de-DE",
      label: "Deutsch (editor only)",
    });
  });

  it("falls back to the code when Intl.DisplayNames throws", async () => {
    locale.language = "de-DE";
    vi.spyOn(Intl, "DisplayNames").mockImplementation(() => {
      throw new RangeError("nope");
    });
    const r = await render(<SettingsMainGrid {...gridProps} />);
    vi.restoreAllMocks();
    const select = r.root.findAll(
      (n) =>
        Array.isArray(n.props.options) &&
        n.props.ariaLabel === "settings.language",
    )[0];
    expect(select.props.options).toContainEqual({
      value: "de-DE",
      label: "de-DE (editor only)",
    });
  });

  it("toggles compact sidebar from the row", async () => {
    const onCompactSidebarChange = vi.fn();
    const r = await render(
      <SettingsMainGrid
        {...gridProps}
        onCompactSidebarChange={onCompactSidebarChange}
      />,
    );
    const sw = byLabel(r.root, "Toggle compact sidebar")[0];
    let node: ReactTestInstance | null = sw.parent;
    while (
      node &&
      !(node.type === "div" && typeof node.props.onClick === "function")
    ) {
      node = node.parent;
    }
    expect(node).not.toBeNull();
    act(() => node!.props.onClick(clickFrom({ closest: () => null })));
    expect(onCompactSidebarChange).toHaveBeenCalledWith(false);
  });
});

describe("PasswordCard", () => {
  it("opens the form with a secondary button, submit is primary", async () => {
    const r = await render(
      <PasswordCard
        mustResetPassword={false}
        logout={vi.fn()}
        onError={vi.fn()}
        onSuccess={vi.fn()}
      />,
    );
    const open = r.root.findAllByType("button")[0];
    expect(open.props.className).toBe("ui-button-secondary");
    expect(text(r)).toContain("You will be signed out afterwards");
    act(() => open.props.onClick());
    const submit = r.root
      .findAllByType("button")
      .find((b) => b.children.join("") === "Change Password")!;
    expect(submit.props.className).toBe("ui-button-primary");
  });
});

describe("LoginRateLimitCard", () => {
  it("labels the lockout button Unlock", async () => {
    const r = await render(
      <LoginRateLimitCard
        loading={false}
        saving={false}
        autoSaveQueued={false}
        dirty={false}
        enabled
        windowMinutes={10}
        maxAttempts={5}
        resetIdentifier=""
        resetLoading={false}
        userEmails={[]}
        onToggleEnabled={vi.fn()}
        onWindowMinutesChange={vi.fn()}
        onMaxAttemptsChange={vi.fn()}
        onResetIdentifierChange={vi.fn()}
        onReset={vi.fn()}
      />,
    );
    const labels = r.root
      .findAllByType("button")
      .map((b) => b.children.join(""));
    expect(labels).toContain("Unlock");
    expect(labels).not.toContain("Reset");
  });
});

const user = (over: Partial<AdminUser>): AdminUser =>
  ({
    id: "u2",
    email: "anna@example.test",
    name: "Anna",
    username: null,
    role: "USER",
    isActive: true,
    mustResetPassword: false,
    createdAt: "2026-01-01",
    ...over,
  }) as AdminUser;

function table(overrides: Record<string, unknown> = {}) {
  const props = {
    users: [user({}), user({ id: "me", name: "Me", email: "me@example.test" })],
    loading: false,
    currentUserId: "me",
    resetPasswordLoadingId: null,
    onRoleChange: vi.fn(),
    onToggleActive: vi.fn(),
    onToggleMustReset: vi.fn(),
    onImpersonate: vi.fn(),
    onResetPassword: vi.fn(),
    ...overrides,
  };
  return { props, element: <UsersTable {...props} /> };
}

describe("UsersTable", () => {
  it("renders Active as a switch and asks before deactivating", async () => {
    const { props, element } = table();
    const r = await render(element);
    const sw = byLabel(r.root, "Active: Anna")[0];
    expect(sw.props.role).toBe("switch");
    expect(sw.props["aria-checked"]).toBe(true);
    act(() => sw.props.onClick());
    expect(props.onToggleActive).not.toHaveBeenCalled();
    const confirm = r.root.findByType("mock-confirm" as React.ElementType);
    expect(confirm.props.title).toBe("Deactivate Anna?");
    expect(confirm.props.message).toBe(
      "They can no longer sign in. Their drawings are kept.",
    );
    act(() => confirm.props.onConfirm());
    expect(props.onToggleActive).toHaveBeenCalledTimes(1);
    expect(props.onToggleActive.mock.calls[0][0].id).toBe("u2");
    expect(
      r.root.findAllByType("mock-confirm" as React.ElementType),
    ).toHaveLength(0);
  });

  it("activates an inactive user without confirm", async () => {
    const { props, element } = table({
      users: [user({ isActive: false })],
    });
    const r = await render(element);
    act(() => byLabel(r.root, "Active: Anna")[0].props.onClick());
    expect(props.onToggleActive).toHaveBeenCalledTimes(1);
    expect(
      r.root.findAllByType("mock-confirm" as React.ElementType),
    ).toHaveLength(0);
  });

  it("cancelling the confirm keeps the user active", async () => {
    const { props, element } = table();
    const r = await render(element);
    act(() => byLabel(r.root, "Active: Anna")[0].props.onClick());
    act(() =>
      r.root.findByType("mock-confirm" as React.ElementType).props.onCancel(),
    );
    expect(props.onToggleActive).not.toHaveBeenCalled();
  });

  it("disables self-deactivation and impersonating yourself", async () => {
    const { element } = table();
    const r = await render(element);
    expect(byLabel(r.root, "Active: Me")[0].props.disabled).toBe(true);
    const imp = r.root
      .findAllByType("button")
      .filter((b) => b.props["aria-label"] === "Impersonate Me");
    expect(imp.length).toBeGreaterThan(0);
    imp.forEach((b) => expect(b.props.disabled).toBe(true));
    const other = r.root
      .findAllByType("button")
      .filter((b) => b.props["aria-label"] === "Impersonate Anna");
    other.forEach((b) => expect(b.props.disabled).toBeFalsy());
  });

  it("uses the new labels", async () => {
    const { element } = table({ resetPasswordLoadingId: "u2" });
    const r = await render(element);
    const json = text(r);
    expect(json).toContain("Must change password");
    expect(json).not.toContain("Reset?");
    expect(json).toContain("Generating…");
    const r2 = await render(table().element);
    const json2 = text(r2);
    expect(json2).toContain("Temporary password");
    expect(json2).not.toContain('"Reset"');
  });

  it("toggles must-change-password via a switch", async () => {
    const { props, element } = table();
    const r = await render(element);
    const sw = byLabel(r.root, "Must change password: Anna")[0];
    act(() => sw.props.onClick());
    expect(props.onToggleMustReset).toHaveBeenCalledTimes(1);
  });

  it("renders a card list below md and the table from md up", async () => {
    const r = await render(table().element);
    const cards = r.root.findAll(
      (n) =>
        n.type === "ul" &&
        String(n.props.className).split(" ").includes("md:hidden"),
    );
    expect(cards).toHaveLength(1);
    const tableWrap = r.root.findAll(
      (n) =>
        n.type === "div" &&
        ["hidden", "md:block"].every((c) =>
          String(n.props.className).split(" ").includes(c),
        ),
    );
    expect(tableWrap).toHaveLength(1);
    expect(cards[0].findAllByType("li")).toHaveLength(2);
    expect(JSON.stringify(cards[0].props.className)).not.toContain(
      "overflow-x",
    );
  });
});
