import { describe, expect, it } from "vitest";
import { addDays, addMonths, resolveDeadline } from "../dates";

describe("deadline dates", () => {
  it("adds calendar months, clamping to the end of the month", () => {
    expect(addMonths("2026-10-23", 3)).toBe("2027-01-23");
    expect(addMonths("2026-08-31", 6)).toBe("2027-02-28");
    expect(addMonths("2027-08-31", 6)).toBe("2028-02-29");
    expect(addMonths("2026-10-23", 60)).toBe("2031-10-23");
  });

  it("adds days across a year end", () => {
    expect(addDays("2026-12-30", 3)).toBe("2027-01-02");
  });

  it("resolves anchors from the date of death", () => {
    expect(resolveDeadline({ from: "apr-15", yearsAfterDeath: 1 }, "2026-10-23")).toBe(
      "2027-04-15",
    );
    expect(resolveDeadline({ from: "dec-31", yearsAfterDeath: 10 }, "2026-10-19")).toBe(
      "2036-12-31",
    );
    expect(resolveDeadline({ from: "date-of-death", months: 9 }, "2026-10-23")).toBe("2027-07-23");
  });
});
