"use server";

import { cookies } from "next/headers";
import { findDemoUser } from "@/data/users";
import { PERSON_COOKIE, SESSION_COOKIE } from "@/lib/session";

/**
 * Signs the browser in as one of the demo users without leaving the page, so
 * the product film can change who is using the app between scenes. Sets the
 * same cookies as the sign-on form (src/lib/auth.ts).
 */
export async function filmSignIn(userId: string): Promise<boolean> {
  const user = findDemoUser(userId);
  if (!user) return false;
  const jar = await cookies();
  const options = { path: "/", httpOnly: true, sameSite: "lax" } as const;
  jar.set(SESSION_COOKIE, user.role, options);
  if (user.personId) jar.set(PERSON_COOKIE, user.personId, options);
  else jar.delete(PERSON_COOKIE);
  return true;
}
