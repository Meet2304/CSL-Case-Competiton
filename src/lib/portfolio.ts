/**
 * A person's money as the home page shows it: a balance sheet (assets and
 * liabilities at PNC, accounts held outside PNC, net value) and a portfolio
 * analysis of the accounts that hold value (allocation, day change and a
 * 12-month value history). Pure functions over the mock returns in
 * src/data/portfolio.ts.
 */
import { dayChange, monthlyReturns } from "@/data/portfolio";
import type { BankAccount } from "@/data/types";
import { assetGroupOf, assetGroups } from "@/lib/household";

const sum = (xs: number[]) => xs.reduce((s, x) => s + x, 0);
const cents = (x: number) => Math.round(x * 100) / 100;

/**
 * PNC assets (positive balances at PNC), PNC liabilities (what is owed, as a
 * positive amount), external accounts and net value. Net value counts only
 * PNC balances: an outside life insurance policy's face value isn't money held.
 */
export function balanceSheet(accounts: BankAccount[]) {
  const atPnc = accounts.filter((a) => !a.external);
  const outside = accounts.filter((a) => a.external);
  const assets = sum(atPnc.filter((a) => a.balance > 0).map((a) => a.balance));
  const liabilities = Math.abs(sum(atPnc.filter((a) => a.balance < 0).map((a) => a.balance)));
  return {
    assets: cents(assets),
    liabilities: cents(liabilities),
    external: cents(sum(outside.map((a) => a.balance))),
    externalCount: outside.length,
    net: cents(assets - liabilities),
  };
}

export type PortfolioGroup = keyof typeof monthlyReturns;

const portfolioGroups = assetGroups.filter((g): g is { id: PortfolioGroup; label: string } =>
  Object.hasOwn(monthlyReturns, g.id),
);

const isPortfolioGroup = (g: string): g is PortfolioGroup => Object.hasOwn(monthlyReturns, g);

/** Month labels ("Oct '25", ... "Oct '26") for each point of a history ending in `asOfIso`'s month. */
export function historyMonths(asOfIso: string, points: number): string[] {
  const [y, m] = asOfIso.split("-").map(Number);
  return Array.from({ length: points }, (_, i) => {
    const d = new Date(Date.UTC(y, m - 1 - (points - 1 - i), 15));
    const month = d.toLocaleDateString("en-US", { month: "short", timeZone: "UTC" });
    return `${month} '${String(d.getUTCFullYear()).slice(2)}`;
  });
}

/**
 * Allocation, change and history for the accounts that hold value at PNC
 * (cash, retirement and investments; cards and outside policies are left out).
 * `series[i]` is the total at the end of month i, oldest first; the last
 * point is today's balance.
 */
export function portfolioAnalysis(accounts: BankAccount[]) {
  const holdings = accounts.flatMap((account) => {
    const group = assetGroupOf(account);
    if (account.external || account.balance <= 0 || !isPortfolioGroup(group)) return [];
    const returns = monthlyReturns[group];
    const history = [account.balance];
    for (let i = returns.length - 1; i >= 0; i--) history.unshift(history[0] / (1 + returns[i]));
    const values = history.map(cents);
    return [
      {
        account,
        group,
        value: account.balance,
        history: values,
        yearChange: cents(account.balance - values[0]),
        dayChange: cents(account.balance * dayChange[group]),
      },
    ];
  });

  const total = cents(sum(holdings.map((h) => h.value)));
  const points = monthlyReturns.cash.length + 1;
  const series = Array.from({ length: points }, (_, i) =>
    cents(sum(holdings.map((h) => h.history[i]))),
  );
  const groups = portfolioGroups
    .map(({ id, label }) => {
      const value = cents(sum(holdings.filter((h) => h.group === id).map((h) => h.value)));
      return { id, label, value, share: total > 0 ? value / total : 0 };
    })
    .filter((g) => g.value > 0);
  const day = cents(sum(holdings.map((h) => h.dayChange)));
  const start = series[0];
  const largest = groups.reduce<(typeof groups)[number] | undefined>(
    (best, g) => (!best || g.value > best.value ? g : best),
    undefined,
  );

  return {
    holdings,
    groups,
    total,
    series,
    dayChange: day,
    dayChangePct: total - day > 0 ? day / (total - day) : 0,
    yearChange: cents(total - start),
    yearChangePct: start > 0 ? (total - start) / start : 0,
    /** Retirement and brokerage accounts. */
    investmentCount: holdings.filter((h) => h.group !== "cash").length,
    largest,
    cashShare: groups.find((g) => g.id === "cash")?.share ?? 0,
  };
}

export type PortfolioAnalysis = ReturnType<typeof portfolioAnalysis>;
