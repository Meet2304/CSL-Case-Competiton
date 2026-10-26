import type { ActionOwner } from "@/data/types";

/** Who does a step, from the advisor's point of view ("You" is the advisor). */
export function ownerLabel(owner: ActionOwner, survivorFirst: string): string {
  const labels: Record<ActionOwner, string> = {
    advisor: "You",
    client: survivorFirst,
    executor: "Executor",
    "bank-operations": "Operations",
    "trust-officer": "Trust officer",
    attorney: "Attorney",
    "tax-advisor": "Tax advisor",
    insurer: "Insurer",
  };
  return labels[owner];
}
