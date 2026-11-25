import React, { useEffect, useState } from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useDashboardSelection } from "../src/pages/dashboard/useDashboardSelection";
import type { DrawingSummary } from "../src/types";

const drawing = (id: string) => ({ id, name: id }) as DrawingSummary;

const probe = {
  latest: new Set<string>(),
  select: (_ids: string[]) => {},
};

const Harness = ({
  drawings,
  isLoading = false,
}: {
  drawings: DrawingSummary[];
  isLoading?: boolean;
}) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  useDashboardSelection({
    drawings,
    isLoading,
    selectedIds,
    setSelectedIds,
    searchInputRef: { current: null },
  });
  useEffect(() => {
    probe.latest = selectedIds;
    probe.select = (ids) => setSelectedIds(new Set(ids));
  });
  return null;
};

let renderer: ReactTestRenderer | null = null;

beforeEach(() => {
  vi.stubGlobal("document", {
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  });
  vi.stubGlobal("window", {
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  });
});

afterEach(() => {
  act(() => renderer?.unmount());
  renderer = null;
  vi.unstubAllGlobals();
});

describe("dashboard selection across list refreshes", () => {
  it("keeps the selection when a refresh returns the same drawings", async () => {
    await act(async () => {
      renderer = create(<Harness drawings={[drawing("a"), drawing("b")]} />);
    });
    await act(async () => probe.select(["a", "b"]));
    // A refresh hands over a new array with the same drawings.
    await act(async () =>
      renderer!.update(<Harness drawings={[drawing("a"), drawing("b")]} />),
    );
    expect([...probe.latest].sort()).toEqual(["a", "b"]);
  });

  it("clears the selection once a selected drawing is no longer listed", async () => {
    await act(async () => {
      renderer = create(<Harness drawings={[drawing("a"), drawing("b")]} />);
    });
    await act(async () => probe.select(["a", "b"]));
    await act(async () =>
      renderer!.update(<Harness drawings={[drawing("b"), drawing("c")]} />),
    );
    expect([...probe.latest]).toEqual([]);
  });

  it("waits for the list to load before dropping anything", async () => {
    await act(async () => {
      renderer = create(<Harness drawings={[drawing("a"), drawing("b")]} />);
    });
    await act(async () => probe.select(["a", "b"]));
    // Switching lists shows an empty placeholder while the request runs.
    await act(async () =>
      renderer!.update(<Harness drawings={[]} isLoading />),
    );
    expect([...probe.latest].sort()).toEqual(["a", "b"]);
    await act(async () =>
      renderer!.update(<Harness drawings={[drawing("a"), drawing("b")]} />),
    );
    expect([...probe.latest].sort()).toEqual(["a", "b"]);
    await act(async () =>
      renderer!.update(<Harness drawings={[drawing("a")]} />),
    );
    expect([...probe.latest]).toEqual([]);
  });
});
