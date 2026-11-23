import React, { useEffect } from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useEditorChrome } from "../src/pages/editor/useEditorChrome";

let visible: boolean | undefined;
const Probe = ({ autoHideEnabled }: { autoHideEnabled: boolean }) => {
  const { isHeaderVisible } = useEditorChrome({
    drawingName: "Drawing",
    autoHideEnabled,
    isRenaming: false,
    isShareOpen: false,
  });
  useEffect(() => {
    visible = isHeaderVisible;
  }, [isHeaderVisible]);
  return null;
};

let pointerListeners: Array<() => void> = [];
let hoverNoneNow = false;
const stubEnvironment = (hoverNone: boolean) => {
  hoverNoneNow = hoverNone;
  pointerListeners = [];
  vi.stubGlobal("document", { title: "" });
  vi.stubGlobal("window", {
    matchMedia: (query: string) => ({
      get matches() {
        return query === "(hover: none)" && hoverNoneNow;
      },
      addEventListener: (_type: string, listener: () => void) =>
        pointerListeners.push(listener),
      removeEventListener: (_type: string, listener: () => void) => {
        pointerListeners = pointerListeners.filter((l) => l !== listener);
      },
    }),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  });
};
const switchPointer = async (hoverNone: boolean) => {
  hoverNoneNow = hoverNone;
  await act(async () => {
    pointerListeners.forEach((listener) => listener());
  });
};

let renderer: ReactTestRenderer | undefined;
const render = async (autoHideEnabled: boolean) => {
  await act(async () => {
    renderer = create(<Probe autoHideEnabled={autoHideEnabled} />);
  });
};

describe("useEditorChrome auto-hide", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    visible = undefined;
  });
  afterEach(() => {
    act(() => renderer?.unmount());
    renderer = undefined;
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("hides the header after the delay on devices with a hover pointer", async () => {
    stubEnvironment(false);
    await render(true);
    await act(async () => {
      vi.advanceTimersByTime(3500);
    });
    expect(visible).toBe(false);
  });

  it("keeps the header visible on touch devices, which have no way to bring it back", async () => {
    stubEnvironment(true);
    await render(true);
    await act(async () => {
      vi.advanceTimersByTime(3500);
    });
    expect(visible).toBe(true);
  });

  it("follows a pointer change at runtime, e.g. a trackpad attached to the iPad", async () => {
    stubEnvironment(true);
    await render(true);
    await switchPointer(false);
    await act(async () => {
      vi.advanceTimersByTime(3500);
    });
    expect(visible).toBe(false);
  });
});
