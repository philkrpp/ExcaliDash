import { describe, expect, it } from "vitest";
import { translate } from "../src/i18n";

describe("translate params", () => {
  it("inserts values literally, even with $ replacement patterns", () => {
    expect(translate("en", "sidebar.itemActions", { name: "Q$&A" })).toBe(
      "Actions for Q$&A",
    );
  });

  it("uses the zh-CN word order", () => {
    expect(translate("zh-CN", "sidebar.itemActions", { name: "花园" })).toBe(
      "花园 的操作",
    );
  });
});
