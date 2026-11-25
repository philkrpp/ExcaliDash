import React, { useEffect } from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useEditorChrome } from "../src/pages/editor/useEditorChrome";

let touchOnly: boolean | undefined;
const Probe = () => {
  const { isTouchOnly } = useEditorChrome({ drawingName: "Drawing" });
  useEffect(() => {
    touchOnly = isTouchOnly;
  }, [isTouchOnly]);
  return null;
};

let listeners: Array<() => void> = [];
let hoverNoneNow = false;
let doc: { title: string };
const stubEnvironment = (hoverNone: boolean) => {
  hoverNoneNow = hoverNone;
  listeners = [];
  doc = { title: "" };
  vi.stubGlobal("document", doc);
  vi.stubGlobal("window", {
    matchMedia: (query: string) => ({
      get matches() {
        return query === "(hover: none)" && hoverNoneNow;
      },
      addEventListener: (_type: string, listener: () => void) =>
        listeners.push(listener),
      removeEventListener: (_type: string, listener: () => void) => {
        listeners = listeners.filter((l) => l !== listener);
      },
    }),
  });
};

let renderer: ReactTestRenderer | undefined;
const render = async () => {
  await act(async () => {
    renderer = create(<Probe />);
  });
};

describe("useEditorChrome", () => {
  afterEach(() => {
    act(() => renderer?.unmount());
    renderer = undefined;
    touchOnly = undefined;
    vi.unstubAllGlobals();
  });

  it("reports touch-only on devices without a hover pointer", async () => {
    stubEnvironment(true);
    await render();
    expect(touchOnly).toBe(true);
  });

  it("follows a pointer change at runtime, e.g. a trackpad attached to the iPad", async () => {
    stubEnvironment(true);
    await render();
    hoverNoneNow = false;
    await act(async () => {
      listeners.forEach((listener) => listener());
    });
    expect(touchOnly).toBe(false);
  });

  it("sets the document title and restores it on unmount", async () => {
    stubEnvironment(false);
    await render();
    expect(doc.title).toBe("Drawing - ExcaliDash");
    act(() => renderer?.unmount());
    renderer = undefined;
    expect(doc.title).toBe("ExcaliDash");
  });
});
