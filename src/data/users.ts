/**
 * MOCK sign-on accounts. The User ID decides who is signed in; any password
 * is accepted. Each customer is a person in the household
 * (src/data/household.ts), so every login sees their own dashboard. The
 * household's earlier User IDs (husband, wife, child1, child2; father, mother; jordan,
 * casey, avery, riley) still sign in.
 */
import type { DemoUser } from "./types";

export const demoUsers: DemoUser[] = [
  {
    userId: "john",
    role: "customer",
    displayName: "John Smith",
    personId: "p-jordan",
    hint: "John Smith, 52",
  },
  {
    userId: "maya",
    role: "customer",
    displayName: "Maya Smith",
    personId: "p-casey",
    hint: "Maya Smith, 49",
  },
  {
    userId: "david",
    role: "customer",
    displayName: "David Smith",
    personId: "p-avery",
    hint: "Older child, 17",
  },
  {
    userId: "alexis",
    role: "customer",
    displayName: "Alexa Smith",
    personId: "p-riley",
    hint: "Younger child, 14",
  },
  { userId: "advisor", role: "advisor", displayName: "Alex Example", hint: "PNC advisor" },
];

/** User IDs from before the household was renamed, so rehearsed sign-ins keep working. */
const previousIds: Record<string, string> = {
  alexa: "alexis",
  husband: "john",
  wife: "maya",
  child1: "david",
  child2: "alexis",
  jordan: "john",
  casey: "maya",
  father: "john",
  mother: "maya",
  avery: "david",
  riley: "alexis",
};

export function findDemoUser(userId: string): DemoUser | undefined {
  const typed = userId.trim().toLowerCase();
  const id = previousIds[typed] ?? typed;
  return demoUsers.find((u) => u.userId === id);
}
