import { describe, it, expect } from "vitest";
import { maskTail } from "@/lib/utils";

describe("maskTail", () => {
  it("shows only the last four characters by default", () => {
    expect(maskTail("GHA-123456789-0")).toBe("•••• 89-0");
    expect(maskTail("0244123456")).toBe("•••• 3456");
  });

  it("honours a custom visible count", () => {
    expect(maskTail("0244123456", 3)).toBe("•••• 456");
  });

  it("hides values too short to mask meaningfully", () => {
    expect(maskTail("1234")).toBe("••••");
    expect(maskTail("12")).toBe("••••");
  });

  // Variable-width masks disclose the identifier's length, which hints at its format.
  it("does not leak the original length", () => {
    expect(maskTail("0244123456")).toHaveLength(maskTail("024412345678").length);
  });

  it("renders a dash for absent values", () => {
    expect(maskTail(undefined)).toBe("—");
    expect(maskTail(null)).toBe("—");
    expect(maskTail("")).toBe("—");
    expect(maskTail("   ")).toBe("—");
  });
});
