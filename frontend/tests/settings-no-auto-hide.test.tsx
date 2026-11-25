import React from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { describe, expect, it, vi } from "vitest";
import { SettingsMainGrid } from "../src/pages/settings/SettingsMainGrid";

vi.mock("../src/context/useLocale", () => ({
  useLocale: () => ({
    language: "en",
    setLanguage: vi.fn(),
    t: (key: string) => key,
  }),
}));
vi.mock("../src/pages/settings/UpdateSettingsCard", () => ({
  UpdateSettingsCard: () => null,
}));

describe("SettingsMainGrid", () => {
  it("offers no editor header auto-hide setting", async () => {
    let renderer: ReactTestRenderer | undefined;
    await act(async () => {
      renderer = create(
        <SettingsMainGrid
          exportBackup={vi.fn()}
          theme="light"
          themePreference="system"
          onThemePreferenceChange={vi.fn()}
          imageCompression={true}
          toggleImageCompression={vi.fn()}
          imageCompressionThresholdMb={1}
          onImageCompressionThresholdChange={vi.fn()}
          compactSidebar={true}
          onCompactSidebarChange={vi.fn()}
          appendDroppedDrawings={false}
          onAppendDroppedDrawingsChange={vi.fn()}
          updateChannel="stable"
          updateInfo={null}
          updateLoading={false}
          updateError={null}
          onUpdateChannelChange={vi.fn()}
          onCheckForUpdates={vi.fn()}
        />,
      );
    });
    const json = JSON.stringify(renderer?.toJSON());
    expect(json).toContain("Compact sidebar");
    expect(json).not.toMatch(/auto-hide/i);
  });
});
