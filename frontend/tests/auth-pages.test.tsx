import React from "react";
import {
  act,
  create,
  type ReactTestInstance,
  type ReactTestRenderer,
} from "react-test-renderer";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const auth = vi.hoisted(() => ({ value: {} as Record<string, unknown> }));
const reset = vi.hoisted(() => ({ capability: vi.fn() }));

vi.mock("../src/context/AuthContext", () => ({ useAuth: () => auth.value }));
vi.mock("../src/api", async () => {
  const actual = await vi.importActual<Record<string, unknown>>("../src/api");
  return {
    ...actual,
    authPasswordResetCapability: reset.capability,
    authPasswordResetRequest: vi.fn(),
  };
});

import { Login } from "../src/pages/Login";
import { AuthSetupChoice } from "../src/pages/AuthSetupChoice";
import { PasswordResetRequest } from "../src/pages/PasswordResetRequest";

const baseAuth = {
  loading: false,
  authEnabled: true,
  registrationEnabled: false,
  authStatusError: null,
  retryAuthStatus: vi.fn(),
  oidcEnabled: false,
  oidcEnforced: false,
  oidcProvider: null,
  bootstrapRequired: false,
  authOnboardingRequired: false,
  authOnboardingMode: null,
  isAuthenticated: false,
  user: null,
  login: vi.fn(),
  logout: vi.fn(),
};

const renderers: ReactTestRenderer[] = [];
async function render(node: React.ReactElement) {
  let renderer!: ReactTestRenderer;
  await act(async () => {
    renderer = create(<MemoryRouter>{node}</MemoryRouter>);
  });
  renderers.push(renderer);
  return renderer;
}

const text = (node: ReactTestInstance): string =>
  node.children
    .map((child) => (typeof child === "string" ? child : text(child)))
    .join("");

beforeEach(() => {
  vi.stubGlobal("window", {
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    setTimeout: (fn: () => void) => {
      void fn;
      return 0;
    },
  });
  vi.stubGlobal("localStorage", {
    getItem: () => null,
    setItem: vi.fn(),
    removeItem: vi.fn(),
  });
});

afterEach(() => {
  act(() => renderers.splice(0).forEach((r) => r.unmount()));
  vi.unstubAllGlobals();
});

describe("login labels", () => {
  it("shows visible field labels tied to the inputs", async () => {
    auth.value = { ...baseAuth };
    const renderer = await render(<Login />);
    const labels = renderer.root.findAllByType("label");
    const byFor = (id: string) => labels.find((l) => l.props.htmlFor === id);
    for (const [id, label] of [
      ["email", "Email address"],
      ["password", "Password"],
    ]) {
      const node = byFor(id)!;
      expect(text(node)).toBe(label);
      expect(node.props.className).toContain("ui-field-label");
      expect(node.props.className).not.toContain("sr-only");
    }
  });
});

describe("auth setup", () => {
  const setup = {
    ...baseAuth,
    authOnboardingRequired: true,
    authOnboardingMode: "fresh",
  };

  it("uses the auth page styling and shows the sentence only once", async () => {
    auth.value = setup;
    const renderer = await render(<AuthSetupChoice />);
    const json = JSON.stringify(renderer.toJSON());
    expect(json).toContain("auth-page");
    expect(json).toContain("auth-wrap");
    expect(json).toContain("auth-panel");
    expect(json).not.toContain("bg-gray-50");
    expect(json).not.toContain("Secure ExcaliDash");
    const heading = renderer.root.findByType("h1");
    expect(heading.props.className).toContain("auth-heading");
    expect(json.match(/restrict access/g) ?? []).toHaveLength(1);
  });

  it("styles the loading state like the other auth pages", async () => {
    auth.value = { ...setup, loading: true };
    const renderer = await render(<AuthSetupChoice />);
    const json = JSON.stringify(renderer.toJSON());
    expect(json).toContain("auth-page");
    expect(json).not.toContain("bg-gray-50");
  });
});

describe("password reset help", () => {
  it("wraps the recovery command and offers a copy button", async () => {
    reset.capability.mockResolvedValue(false);
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { clipboard: { writeText } });
    const renderer = await render(<PasswordResetRequest />);
    const pre = renderer.root.findByType("pre");
    expect(pre.props.className).toContain("whitespace-pre-wrap");
    expect(pre.props.className).toContain("break-words");
    expect(pre.props.className).not.toContain("overflow-x-auto");
    const button = renderer.root.findAll(
      (n) => n.type === "button" && /^Copy/.test(n.props["aria-label"] ?? ""),
    )[0];
    expect(button.props.className).toContain("[@media(hover:none)]:h-11");
    await act(async () => button.props.onClick());
    expect(writeText).toHaveBeenCalledWith(
      expect.stringContaining("node scripts/admin-recover.cjs"),
    );
  });
});
