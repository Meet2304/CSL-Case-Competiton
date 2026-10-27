/**
 * MOCK sign-on accounts. The User ID decides who is signed in; any password
 * is accepted. Each customer is a person in the Sample household
 * (src/data/household.ts), so every login sees their own dashboard.
 */
import type { DemoUser } from "./types";

export const demoUsers: DemoUser[] = [
  {
    userId: "jordan",
    role: "customer",
    displayName: "Jordan Sample",
    personId: "p-jordan",
    hint: "Husband, 52",
  },
  {
    userId: "casey",
    role: "customer",
    displayName: "Casey Sample",
    personId: "p-casey",
    hint: "Spouse, 49",
  },
  {
    userId: "avery",
    role: "customer",
    displayName: "Avery Sample",
    personId: "p-avery",
    hint: "Child, 17",
  },
  {
    userId: "riley",
    role: "customer",
    displayName: "Riley Sample",
    personId: "p-riley",
    hint: "Child, 14",
  },
  { userId: "advisor", role: "advisor", displayName: "Alex Example", hint: "PNC advisor" },
];

export function findDemoUser(userId: string): DemoUser | undefined {
  const id = userId.trim().toLowerCase();
  return demoUsers.find((u) => u.userId === id);
}
