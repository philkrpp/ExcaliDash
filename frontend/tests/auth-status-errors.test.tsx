import React from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { MemoryRouter } from "react-router-dom";
import { AxiosError, type InternalAxiosRequestConfig } from "axios";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const api = vi.hoisted(() => ({ authStatus: vi.fn() }));

vi.mock("../src/api", async () => {
  const { default: axios } = await import("axios");
  return {
    authStatus: api.authStatus,
    authMe: vi.fn().mockRejectedValue(new Error("no session")),
    refreshAccessToken: vi.fn().mockRejectedValue(new Error("no session")),
    authLogout: vi.fn(),
    authLogin: vi.fn(),
    authRegister: vi.fn(),
    isAxiosError: axios.isAxiosError,
    startOidcSignOut: vi.fn(),
  };
});
vi.mock("sonner", () => ({ toast: { error: vi.fn() } }));

import { AuthProvider, useAuth } from "../src/context/AuthContext";
import { AuthStatusErrorPanel } from "../src/components/AuthStatusErrorPanel";

const httpError = (status: number, headers: Record<string, string> = {}) =>
  new AxiosError(
    `Request failed with status code ${status}`,
    "ERR_BAD_RESPONSE",
    undefined,
    undefined,
    {
      status,
      statusText: "",
      data: {},
      headers,
      config: {} as InternalAxiosRequestConfig,
    },
  );

const renderers: ReactTestRenderer[] = [];

const Probe = () => {
  return <span>{useAuth().authStatusError}</span>;
};

async function loadWith(error: unknown) {
  api.authStatus.mockRejectedValue(error);
  await act(async () => {
    renderers.push(
      create(
        <MemoryRouter>
          <AuthProvider>
            <Probe />
          </AuthProvider>
        </MemoryRouter>,
      ),
    );
  });
  return renderers[renderers.length - 1].root
    .findByType("span")
    .children.join("");
}

beforeEach(() => {
  const store = new Map<string, string>();
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => void store.set(key, value),
    removeItem: (key: string) => void store.delete(key),
  });
  vi.stubGlobal("window", {
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  });
  vi.spyOn(console, "error").mockImplementation(() => undefined);
});

afterEach(() => {
  act(() => renderers.splice(0).forEach((r) => r.unmount()));
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("auth status errors", () => {
  it("explains a 429 as rate limiting without a Retry-After header", async () => {
    expect(await loadWith(httpError(429))).toBe(
      "Too many requests\nThe server is rate limiting right now. Try again in a minute.",
    );
  });

  it("uses Retry-After seconds for a 429 when the server sends them", async () => {
    expect(await loadWith(httpError(429, { "retry-after": "42" }))).toBe(
      "Too many requests\nThe server is rate limiting right now. Try again in 42 seconds.",
    );
  });

  it("ignores an unparsable Retry-After value", async () => {
    expect(
      await loadWith(httpError(429, { "retry-after": "Wed, 21 Oct 2026" })),
    ).toContain("Try again in a minute");
  });

  it("keeps the operator hint when the server cannot be reached", async () => {
    const networkError = new AxiosError("Network Error", "ERR_NETWORK");
    expect(await loadWith(networkError)).toBe(
      "Unable to reach the backend API. Check BACKEND_URL, FRONTEND_URL, and your reverse proxy configuration.",
    );
  });

  it.each([502, 503, 504])(
    "treats a gateway error (%i) as an unreachable backend",
    async (status) => {
      expect(await loadWith(httpError(status))).toContain(
        "Unable to reach the backend API. Check BACKEND_URL",
      );
    },
  );

  it("names the HTTP status for other server errors", async () => {
    const message = await loadWith(httpError(500));
    expect(message).toContain("HTTP 500");
    expect(message).not.toContain("Unable to reach");
  });
});

describe("auth status error panel", () => {
  it("shows the message in an auth panel with a Try again button", async () => {
    const onRetry = vi.fn();
    let renderer!: ReactTestRenderer;
    await act(async () => {
      renderer = create(
        <AuthStatusErrorPanel
          message="Too many requests."
          onRetry={onRetry}
          fullScreen
        />,
      );
    });
    renderers.push(renderer);
    const json = JSON.stringify(renderer.toJSON());
    expect(json).toContain("auth-page");
    expect(json).toContain("auth-panel");
    expect(json).not.toContain("bg-gray-900");
    expect(json).not.toContain("rounded-md");
    const button = renderer.root.findByType("button");
    expect(button.children).toEqual(["Try again"]);
    await act(async () => button.props.onClick());
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it("renders a first line before a newline as a bold title", async () => {
    let renderer!: ReactTestRenderer;
    await act(async () => {
      renderer = create(
        <AuthStatusErrorPanel
          message={"Too many requests\nTry again in a minute."}
          onRetry={vi.fn()}
        />,
      );
    });
    renderers.push(renderer);
    const title = renderer.root.find(
      (node) =>
        typeof node.props.className === "string" &&
        node.props.className.includes("font-bold") &&
        node.children[0] === "Too many requests",
    );
    expect(title).toBeDefined();
    expect(JSON.stringify(renderer.toJSON())).toContain("Try again in a minute.");
  });
});
