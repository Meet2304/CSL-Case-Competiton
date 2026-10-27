// Server only: reads the session cookie.
import { cookies } from "next/headers";
import { people } from "@/data/household";
import { PERSON_COOKIE } from "@/lib/session";

/** The household member a customer signed in as; Jordan when the cookie is missing. */
export async function viewerId(): Promise<string> {
  const id = (await cookies()).get(PERSON_COOKIE)?.value;
  return people.some((p) => p.id === id && p.login) ? id! : "p-jordan";
}
