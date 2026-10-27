import type { Clause } from "@/data/types";

type Value = string | number | boolean;

/** Every clause must hold; a clause with several operators needs all of them to hold. */
export function holds<K extends string>(clauses: Clause<K>[], values: Record<K, Value>): boolean {
  return clauses.every((c) => {
    if (!(c.fact in values)) throw new Error(`Unknown fact in rule clause: ${c.fact}`);
    const v = values[c.fact];
    if (c.eq !== undefined && v !== c.eq) return false;
    if (c.in !== undefined && !c.in.includes(v)) return false;
    if (c.gt !== undefined && !(typeof v === "number" && v > c.gt)) return false;
    if (c.lte !== undefined && !(typeof v === "number" && v <= c.lte)) return false;
    return true;
  });
}

/** `{ fact: { value, evidence } }` → `{ fact: value }`, for `holds`. */
export function plainValues<K extends string>(
  facts: Record<K, { value: Value }>,
): Record<K, Value> {
  return Object.fromEntries(
    Object.entries<{ value: Value }>(facts).map(([k, f]) => [k, f.value]),
  ) as Record<K, Value>;
}
