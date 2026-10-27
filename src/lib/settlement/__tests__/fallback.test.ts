// Outside Pennsylvania the engine falls back to "attorney confirms" for state law.
import { describe, expect, it } from "vitest";
import { byHolding, lossPlan } from "./helpers";

const pa = lossPlan("c-example");
const other = lossPlan("c-example", { state: "other" });

describe("Avery Example with a non-PA address", () => {
  it("sends probate assets to the attorney", () => {
    expect(byHolding(other, "h-ex-dbrk")!.outcome.id).toBe("o.probate-other-state");
  });

  it("swaps the PA rules for the unmodelled-state rule", () => {
    const ids = other.household.map((h) => h.rule.id);
    expect(ids).toContain("hh.state-unmodelled");
    expect(ids.some((id) => id.startsWith("hh.pa-"))).toBe(false);
  });

  it("keeps the federal rules unchanged", () => {
    const federal = (p: typeof pa) =>
      p.household
        .filter((h) => h.rule.jurisdiction === "US" && h.rule.id !== "hh.state-unmodelled")
        .map((h) => h.rule.id);
    expect(federal(other)).toEqual(federal(pa));
  });
});
