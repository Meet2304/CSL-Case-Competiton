"use client";

import { useActionState, useRef, useState } from "react";
import { FlaskConical, ScanFace } from "lucide-react";
import { FacetBackdrop } from "@/components/brand/FacetBackdrop";
import { PncLogo } from "@/components/brand/PncLogo";
import { Toggle } from "@/components/ui/Toggle";
import { demoUsers } from "@/data/users";
import { signIn, type SignInState } from "@/lib/auth";

/** Native-style sign-on. The User ID picks the customer or advisor experience. */
export function MobileSignOn() {
  const [saveId, setSaveId] = useState(true);
  const [state, action, pending] = useActionState<SignInState, FormData>(signIn, {});
  const userIdRef = useRef<HTMLInputElement>(null);

  return (
    <div className="relative isolate flex flex-1 flex-col px-7 pt-[calc(var(--status-h)+4rem)] text-white">
      <FacetBackdrop className="-z-10" />
      <PncLogo tone="light" size="lg" className="self-center" />

      <form action={action} className="mt-16 flex flex-col">
        <label htmlFor="m-user-id" className="text-sm text-white/90">
          User ID
        </label>
        <input
          ref={userIdRef}
          id="m-user-id"
          name="userId"
          required
          autoComplete="off"
          autoCapitalize="none"
          aria-invalid={state.error ? true : undefined}
          className="border-b border-white/70 bg-transparent py-2 text-lg tracking-wide outline-none placeholder:text-white/70 focus:border-white"
        />
        <input
          name="password"
          type="password"
          aria-label="Password"
          placeholder="Enter Password"
          autoComplete="off"
          className="mt-8 border-b border-white/70 bg-transparent py-2 text-lg outline-none placeholder:text-white/90 focus:border-white"
        />

        <div className="mt-7 flex items-center justify-between text-md">
          <span className="flex items-center gap-3">
            Save user ID <Toggle checked={saveId} onChange={setSaveId} label="Save user ID" />
          </span>
          <button type="submit" className="flex items-center gap-2">
            <ScanFace className="size-6" strokeWidth={1.5} /> Face ID
          </button>
        </div>

        {state.error && (
          <p role="alert" className="mt-5 rounded-lg bg-white/15 px-3 py-2 text-sm">
            {state.error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="mt-8 rounded-full bg-white/20 py-3.5 text-lg font-semibold hover:bg-white/30 disabled:opacity-70"
        >
          {pending ? "Signing In…" : "Sign In"}
        </button>
        <a href="#" className="mt-5 text-center text-md">
          Forgot User ID or Password?
        </a>
      </form>

      <div className="mt-auto mb-8 text-center text-xs text-white/80">
        <p className="flex items-center justify-center gap-1.5 font-semibold">
          <FlaskConical className="size-3.5 shrink-0" /> Demo sign-on · any password
        </p>
        <p className="mt-2 flex justify-center gap-2">
          {demoUsers.map((u) => (
            <button
              key={u.userId}
              type="button"
              onClick={() => {
                if (userIdRef.current) userIdRef.current.value = u.userId;
              }}
              className="rounded-full bg-white/15 px-3 py-1 font-semibold text-white hover:bg-white/25"
            >
              {u.userId}
            </button>
          ))}
        </p>
      </div>
    </div>
  );
}
