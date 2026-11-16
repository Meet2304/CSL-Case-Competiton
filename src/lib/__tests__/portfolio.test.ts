import { describe, expect, it } from "vitest";
import { seedFamilies } from "@/data/household";
import { accountsOf, currentAccounts, type HouseholdState } from "@/lib/household";
import {
  balanceSheet,
  historyMonths,
  monthLabel,
  portfolioAnalysis,
  projectPortfolio,
} from "@/lib/portfolio";

const seed: HouseholdState = { families: seedFamilies, designations: {} };
const owned = (id: string) => accountsOf(currentAccounts(seed), id).owned;

describe("balance sheet", () => {
  it("splits PNC assets, PNC liabilities and outside accounts; net counts PNC only", () => {
    const s = balanceSheet(owned("p-jordan"));
    expect(s.assets).toBe(12_480.55 + 18_250 + 184_000 + 96_500);
    expect(s.liabilities).toBe(1_284.19);
    expect(s.external).toBe(500_000);
    expect(s.externalCount).toBe(1);
    expect(s.net).toBeCloseTo(s.assets - s.liabilities, 2);
  });

  it("works for a child with one account and nothing owed", () => {
    const s = balanceSheet(owned("p-riley"));
    expect(s).toMatchObject({ assets: 860, liabilities: 0, external: 0, net: 860 });
  });
});

describe("portfolio analysis", () => {
  it("allocates value across cash, retirement and investments, leaving cards and policies out", () => {
    const p = portfolioAnalysis(owned("p-jordan"));
    expect(p.holdings.map((h) => h.account.id)).not.toContain("acct-jordan-card");
    expect(p.holdings.map((h) => h.account.id)).not.toContain("acct-jordan-life");
    expect(p.groups.map((g) => g.id)).toEqual(["cash", "retirement", "investments"]);
    expect(p.total).toBeCloseTo(311_230.55, 2);
    expect(p.groups.reduce((s, g) => s + g.share, 0)).toBeCloseTo(1, 6);
    expect(p.investmentCount).toBe(2);
    expect(p.largest?.id).toBe("retirement");
  });

  it("ends its history at today's balance and reports the change since the start", () => {
    const p = portfolioAnalysis(owned("p-casey"));
    expect(p.series).toHaveLength(13);
    expect(p.series.at(-1)).toBeCloseTo(p.total, 2);
    expect(p.yearChange).toBeCloseTo(p.total - p.series[0], 2);
    expect(p.yearChange).toBeGreaterThan(0);
  });

  it("is all cash for a child", () => {
    const p = portfolioAnalysis(owned("p-avery"));
    expect(p.groups).toEqual([expect.objectContaining({ id: "cash", share: 1 })]);
    expect(p.investmentCount).toBe(0);
    expect(p.dayChange).toBe(0);
  });

  it("labels the months ending in the as-of month", () => {
    expect(historyMonths("2026-10-25", 13)).toEqual([
      "Oct '25",
      "Nov '25",
      "Dec '25",
      "Jan '26",
      "Feb '26",
      "Mar '26",
      "Apr '26",
      "May '26",
      "Jun '26",
      "Jul '26",
      "Aug '26",
      "Sep '26",
      "Oct '26",
    ]);
  });
});

describe("projection", () => {
  const p = portfolioAnalysis(owned("p-jordan"));
  const ahead = projectPortfolio(p.holdings, 12);

  it("starts every scenario at today's total", () => {
    for (const s of [ahead.weak, ahead.expected, ahead.strong]) {
      expect(s).toHaveLength(13);
      expect(s[0]).toBeCloseTo(p.total, 2);
    }
  });

  it("keeps the scenarios in order: weak below expected below strong", () => {
    for (let i = 1; i <= 12; i++) {
      expect(ahead.weak[i]).toBeLessThan(ahead.expected[i]);
      expect(ahead.expected[i]).toBeLessThan(ahead.strong[i]);
    }
  });

  it("labels months ahead of the as-of date", () => {
    expect(monthLabel("2026-10-25", 0)).toBe("Oct '26");
    expect(monthLabel("2026-10-25", 3)).toBe("Jan '27");
    expect(monthLabel("2026-10-25", -12)).toBe("Oct '25");
  });
});
