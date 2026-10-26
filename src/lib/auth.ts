"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { findDemoUser } from "@/data/users";
import { routes } from "@/lib/routes";
import { homeFor, SESSION_COOKIE } from "@/lib/session";

export type SignInState = { error?: string };

/** Demo sign-on: the User ID picks the role, any password is accepted. */
export async function signIn(_prev: SignInState, formData: FormData): Promise<SignInState> {
  const user = findDemoUser(String(formData.get("userId") ?? ""));
  if (!user) {
    return { error: "We don't recognize that User ID. Try “customer” or “advisor”." };
  }
  (await cookies()).set(SESSION_COOKIE, user.role, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
  });
  redirect(homeFor(user.role));
}

export async function signOff(): Promise<void> {
  (await cookies()).delete(SESSION_COOKIE);
  redirect(routes.signOn);
}
