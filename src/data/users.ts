/**
 * MOCK sign-on accounts. The User ID decides which experience loads; any
 * password is accepted. Add a row here to create another demo login.
 */
import type { DemoUser } from "./types";

export const demoUsers: DemoUser[] = [
  { userId: "customer", role: "customer", displayName: "Jordan Sample" },
  { userId: "advisor", role: "advisor", displayName: "Alex Example" },
];

export function findDemoUser(userId: string): DemoUser | undefined {
  const id = userId.trim().toLowerCase();
  return demoUsers.find((u) => u.userId === id);
}
