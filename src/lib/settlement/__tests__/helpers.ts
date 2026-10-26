import { advisorCustomers } from "@/data/advisor";
import { profileFor } from "@/data/clients";
import { MOCK_AS_OF } from "@/data/mock";
import { factsFor } from "@/lib/assistant";
import { settlementInputFromFacts } from "../adapters";
import { settlementPlan, type SettlementInput } from "../engine";

/** Client facts exactly as the advisor app builds them. */
export function clientFacts(customerId: string) {
  const c = advisorCustomers.find((x) => x.id === customerId)!;
  const p = profileFor(customerId)!;
  return factsFor(c, p, MOCK_AS_OF);
}

export function lossInput(customerId: string): SettlementInput {
  return settlementInputFromFacts(clientFacts(customerId))!;
}

export function lossPlan(customerId: string, patch: Partial<SettlementInput> = {}) {
  return settlementPlan({ ...lossInput(customerId), ...patch });
}

export const byHolding = (plan: ReturnType<typeof settlementPlan>, id: string) =>
  plan.accounts.find((a) => a.holding.id === id);
