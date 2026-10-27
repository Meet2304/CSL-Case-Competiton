/**
 * MOCK sign-on accounts. The User ID decides who is signed in; any password
 * is accepted. Each customer is a person in the Sample household
 * (src/data/household.ts), so every login sees their own dashboard. The
 * household's earlier User IDs (father, mother; jordan, casey, avery, riley) still sign in.
 */
import type { DemoUser } from "./types";

export const demoUsers: DemoUser[] = [
  {
    userId: "husband",
    role: "customer",
    displayName: "Husband",
    personId: "p-jordan",
    hint: "Husband, 52",
  },
  {
    userId: "wife",
    role: "customer",
    displayName: "Wife",
    personId: "p-casey",
    hint: "Wife, 49",
  },
  {
    userId: "child1",
    role: "customer",
    displayName: "Child 1",
    personId: "p-avery",
    hint: "Older child, 17",
  },
  {
    userId: "child2",
    role: "customer",
    displayName: "Child 2",
    personId: "p-riley",
    hint: "Younger child, 14",
  },
  { userId: "advisor", role: "advisor", displayName: "Alex Example", hint: "PNC advisor" },
];

/** User IDs from before the household was renamed, so rehearsed sign-ins keep working. */
const previousIds: Record<string, string> = {
  jordan: "husband",
  casey: "wife",
  father: "husband",
  mother: "wife",
  avery: "child1",
  riley: "child2",
};

export function findDemoUser(userId: string): DemoUser | undefined {
  const typed = userId.trim().toLowerCase();
  const id = previousIds[typed] ?? typed;
  return demoUsers.find((u) => u.userId === id);
}
