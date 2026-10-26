"use client";

import { useActionState, useRef } from "react";
import { demoUsers } from "@/data/users";
import { signIn, type SignInState } from "@/lib/auth";

/** Demo sign-on: the User ID picks the customer or advisor experience. */
export function WebSignOnForm() {
  const [state, action, pending] = useActionState<SignInState, FormData>(signIn, {});
  const userIdRef = useRef<HTMLInputElement>(null);
  return (
    <form
      action={action}
      className="w-full max-w-sm justify-self-center rounded-lg bg-white p-6 shadow-raised md:justify-self-end"
    >
      <h2 className="text-xl font-semibold">Sign On</h2>
      <label className="mt-5 block text-sm font-semibold text-pnc-muted" htmlFor="web-user-id">
        User ID
      </label>
      <input
        ref={userIdRef}
        id="web-user-id"
        name="userId"
        required
        autoFocus
        autoComplete="off"
        autoCapitalize="none"
        aria-invalid={state.error ? true : undefined}
        aria-describedby="web-sign-on-help"
        className="mt-1 w-full rounded-md border border-pnc-line px-3 py-2.5 outline-none focus:border-pnc-link aria-invalid:border-pnc-negative"
      />
      <label className="mt-4 block text-sm font-semibold text-pnc-muted" htmlFor="web-password">
        Password
      </label>
      <input
        id="web-password"
        name="password"
        type="password"
        placeholder="Any value works in this demo"
        autoComplete="off"
        className="mt-1 w-full rounded-md border border-pnc-line px-3 py-2.5 outline-none focus:border-pnc-link"
      />
      {state.error && (
        <p role="alert" className="mt-3 text-sm text-pnc-negative">
          {state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="mt-6 w-full rounded-full bg-pnc-orange py-3 font-semibold text-white hover:bg-pnc-orange-600 disabled:opacity-70"
      >
        {pending ? "Signing On…" : "Sign On"}
      </button>
      <div id="web-sign-on-help" className="mt-4 rounded-md bg-pnc-surface px-3 py-2.5 text-xs text-pnc-muted">
        <p>Demo sign-on — pick a User ID, any password works:</p>
        <p className="mt-1.5 flex flex-wrap gap-2">
          {demoUsers.map((u) => (
            <button
              key={u.userId}
              type="button"
              onClick={() => {
                if (!userIdRef.current) return;
                userIdRef.current.value = u.userId;
                userIdRef.current.focus();
              }}
              className="rounded-full border border-pnc-line bg-white px-2.5 py-1 font-semibold text-pnc-ink hover:border-pnc-link hover:text-pnc-link"
            >
              {u.userId} <span className="font-normal text-pnc-muted">· {u.role}</span>
            </button>
          ))}
        </p>
      </div>
    </form>
  );
}
