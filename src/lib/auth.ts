"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { findDemoUser } from "@/data/users";
import { routes } from "@/lib/routes";
import { homeFor, PERSON_COOKIE, SESSION_COOKIE } from "@/lib/session";

export type SignInState = { error?: string };

/** Demo sign-on: the User ID picks the role, any password is accepted. */
export async function signIn(_prev: SignInState, formData: FormData): Promise<SignInState> {
  const user = findDemoUser(String(formData.get("userId") ?? ""));
  if (!user) {
    return {
      error: "We don't recognize that User ID. Try jordan, casey, avery, riley or advisor.",
    };
  }
  const jar = await cookies();
  const options = { path: "/", httpOnly: true, sameSite: "lax" } as const;
  jar.set(SESSION_COOKIE, user.role, options);
  if (user.personId) jar.set(PERSON_COOKIE, user.personId, options);
  else jar.delete(PERSON_COOKIE);
  redirect(homeFor(user.role));
}

export async function signOff(): Promise<void> {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
  jar.delete(PERSON_COOKIE);
  redirect(routes.signOn);
}
