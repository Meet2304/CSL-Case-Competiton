import type { Role } from "@/data/types";
import { routes } from "@/lib/routes";

/**
 * Demo session: a cookie holding the signed-in role. Set by the sign-in
 * Server Action, read by src/proxy.ts to send each role to its own pages.
 * There is no real authentication — this is a prototype.
 */
export const SESSION_COOKIE = "pnc-session";

export function parseRole(value: string | undefined): Role | undefined {
  return value === "customer" || value === "advisor" ? value : undefined;
}

export function homeFor(role: Role): string {
  return role === "advisor" ? routes.advisor : routes.accounts;
}

export function isAdvisorPath(path: string): boolean {
  return path === routes.advisor || path.startsWith(`${routes.advisor}/`);
}
