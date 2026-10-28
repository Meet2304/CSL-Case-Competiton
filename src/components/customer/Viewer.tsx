"use client";

import Link from "next/link";
import { createContext, useContext, useMemo, type ReactNode } from "react";
import { HeartHandshake } from "lucide-react";
import { SignOffButton } from "@/components/shared/SignOffButton";
import { people } from "@/data/household";
import { MOCK_AS_OF } from "@/data/mock";
import { ageOn, currentAccounts, firstName, personById } from "@/lib/household";
import { useDeceasedIds, useHousehold } from "@/lib/householdStore";
import { useBereavement } from "@/lib/bereavement";
import { routes } from "@/lib/routes";

const ViewerContext = createContext<string>(people[0].id);

/** Who is signed in, from the session cookie (read by the server layout). */
export function ViewerProvider({ personId, children }: { personId: string; children: ReactNode }) {
  return <ViewerContext.Provider value={personId}>{children}</ViewerContext.Provider>;
}

/** The signed-in person, the household as saved in this browser, and any recorded deaths. */
export function useViewer() {
  const id = useContext(ViewerContext);
  const household = useHousehold();
  const deceasedIds = useDeceasedIds();
  const { losses } = useBereavement();
  const accounts = useMemo(() => currentAccounts(household), [household]);
  const person = personById(id)!;
  const age = ageOn(person.birthdate, MOCK_AS_OF);
  // The most recent death of someone else in the household, if any.
  const loss = [...losses]
    .reverse()
    .find((l) => l.personName !== person.name && people.some((p) => p.name === l.personName));
  return {
    person,
    first: firstName(person.name),
    age,
    isMinor: age < 18,
    isDeceased: deceasedIds.includes(id),
    household,
    accounts,
    deceasedIds,
    loss,
  };
}

/**
 * If the signed-in person has died, their own banking is closed while the
 * estate is settled; everything else renders normally.
 */
export function ViewerGate({ children }: { children: ReactNode }) {
  const { person, isDeceased } = useViewer();
  if (!isDeceased) return <>{children}</>;
  return (
    <div className="mx-auto max-w-xl px-4 py-16 text-center">
      <HeartHandshake className="mx-auto size-10 text-pnc-muted" aria-hidden="true" />
      <h1 className="mt-4 font-display text-2xl font-medium text-pnc-ink">
        {person.name}&apos;s accounts are being settled
      </h1>
      <p className="mt-3 text-md leading-relaxed text-pnc-muted">
        PNC has been told that {firstName(person.name)} has passed away, so online banking for this
        login is closed while the family settles the estate. Family members can sign in with their
        own User ID to see what happens next.
      </p>
      <div className="mt-6 flex justify-center gap-3">
        <SignOffButton
          label="Sign in as someone else"
          className="rounded-full bg-pnc-blue-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-pnc-blue-800"
        >
          Sign in as someone else
        </SignOffButton>
        <Link
          href={routes.help}
          className="rounded-full px-5 py-2.5 text-sm font-semibold text-pnc-link ring-1 ring-pnc-line hover:ring-pnc-link"
        >
          Get help
        </Link>
      </div>
    </div>
  );
}
