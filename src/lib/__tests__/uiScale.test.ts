import { describe, expect, it } from "vitest";
import { nextUiScale } from "@/lib/uiScale";

describe("interface scale", () => {
  it("cycles normal, larger, largest and back to normal", () => {
    expect(nextUiScale(undefined)).toBe("lg");
    expect(nextUiScale("lg")).toBe("xl");
    expect(nextUiScale("xl")).toBe("");
  });

  it("starts over from an unknown saved value", () => {
    expect(nextUiScale("huge")).toBe("lg");
  });
});
