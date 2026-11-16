/**
 * MOCK DATA for the home page's Portfolio Analysis and My Team cards. Every
 * figure, name, phone number and email here is invented. Market returns are
 * illustrative only and drive the value history the chart draws: each
 * account's past value is its current balance walked back through its group's
 * monthly returns (see src/lib/portfolio.ts).
 */
import type { TeamContact } from "./types";

/** Monthly returns, oldest first, for the 12 months ending at MOCK_AS_OF. 0.012 = +1.2%. */
export const monthlyReturns = {
  cash: [0.003, 0.003, 0.003, 0.003, 0.003, 0.003, 0.003, 0.003, 0.003, 0.003, 0.003, 0.003],
  retirement: [
    0.012, -0.008, 0.021, 0.006, -0.014, 0.024, 0.011, 0.003, 0.018, -0.006, 0.015, 0.009,
  ],
  investments: [
    0.018, -0.015, 0.029, 0.004, -0.022, 0.031, 0.016, -0.004, 0.025, -0.011, 0.022, 0.013,
  ],
} as const;

/** Today's change by group, as a fraction of the balance. */
export const dayChange = {
  cash: 0,
  retirement: 0.0021,
  investments: 0.0038,
} as const;

/**
 * Yearly returns for the chart's look ahead, by scenario and group. Illustrative
 * only: a projection, not a forecast or advice. 0.06 = +6% a year.
 */
export const scenarioReturns = {
  weak: { cash: 0.025, retirement: -0.06, investments: -0.1 },
  expected: { cash: 0.036, retirement: 0.06, investments: 0.07 },
  strong: { cash: 0.042, retirement: 0.12, investments: 0.15 },
} as const;

/** The people who look after the household's relationship at the bank, named by role. */
export const relationshipTeam: TeamContact[] = [
  {
    id: "team-advisor",
    name: "Bank Advisor",
    title: "Wealth Advisor",
    phone: "(412) 555-0142",
    email: "bank.advisor@example.com",
    // The same portrait the advisor has in their own view of the app.
    avatarSeed: "advisor",
  },
  {
    id: "team-service",
    name: "Client Service Associate",
    title: "Client Service",
    phone: "(412) 555-0178",
    email: "client.service@example.com",
    avatar: "service",
    avatarSeed: "team-service",
  },
  {
    id: "team-support",
    name: "Private Bank Support",
    title: "Client Support",
    phone: "(800) 555-0199",
    email: "support@example.com",
    avatar: "support",
    avatarSeed: "team-support",
  },
];
