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

/** The people who look after the household's relationship at the bank, named by role. */
export const relationshipTeam: TeamContact[] = [
  {
    id: "team-advisor",
    name: "Bank Advisor",
    title: "Wealth Advisor",
    phone: "(412) 555-0142",
    email: "bank.advisor@example.com",
  },
  {
    id: "team-service",
    name: "Client Service Associate",
    title: "Client Service",
    phone: "(412) 555-0178",
    email: "client.service@example.com",
  },
  {
    id: "team-support",
    name: "Private Bank Support",
    title: "Client Support",
    phone: "(800) 555-0199",
    email: "support@example.com",
  },
];
