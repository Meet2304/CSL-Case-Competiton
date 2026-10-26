"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { FlaskConical, ScanFace } from "lucide-react";
import { FacetBackdrop } from "@/components/brand/FacetBackdrop";
import { PncLogo } from "@/components/brand/PncLogo";
import { Toggle } from "@/components/ui/Toggle";
import { customer } from "@/data/mock";
import { routes } from "@/lib/routes";

/** Native-style sign-on. Any input (or Face ID) "signs in" — demo only. */
export function MobileSignOn() {
  const router = useRouter();
  const [saveId, setSaveId] = useState(true);
  const signIn = () => router.push(routes.accounts);

  return (
    <div className="relative isolate flex flex-1 flex-col px-7 pt-[calc(var(--status-h)+4rem)] text-white">
      <FacetBackdrop className="-z-10" />
      <PncLogo tone="light" size="lg" className="self-center" />

      <form
        className="mt-16 flex flex-col"
        onSubmit={(e) => {
          e.preventDefault();
          signIn();
        }}
      >
        <label htmlFor="m-user-id" className="text-sm text-white/90">
          User ID
        </label>
        <input
          id="m-user-id"
          defaultValue={customer.userIdMasked}
          autoComplete="off"
          className="border-b border-white/70 bg-transparent py-2 text-lg tracking-wide outline-none placeholder:text-white/70 focus:border-white"
        />
        <input
          type="password"
          aria-label="Password"
          placeholder="Enter Password"
          autoComplete="off"
          className="mt-8 border-b border-white/70 bg-transparent py-2 text-lg outline-none placeholder:text-white/90 focus:border-white"
        />

        <div className="mt-7 flex items-center justify-between text-[15px]">
          <span className="flex items-center gap-3">
            Save user ID <Toggle checked={saveId} onChange={setSaveId} label="Save user ID" />
          </span>
          <button type="button" onClick={signIn} className="flex items-center gap-2">
            <ScanFace className="size-6" strokeWidth={1.5} /> Face ID
          </button>
        </div>

        <button type="submit" className="mt-10 rounded-full bg-white/20 py-3.5 text-lg font-semibold hover:bg-white/30">
          Sign In
        </button>
        <a href="#" className="mt-5 text-center text-[15px]">
          Forgot User ID or Password?
        </a>
      </form>

      <p className="mt-auto mb-8 flex items-center justify-center gap-1.5 text-center text-xs font-semibold text-white/80">
        <FlaskConical className="size-3.5" /> Demo prototype · any credentials work · mock data only
      </p>
    </div>
  );
}
