"use client";

import { useRouter } from "next/navigation";
import { customer } from "@/data/mock";
import { routes } from "@/lib/routes";

/** Demo sign-on: any input "succeeds" and routes to the dashboard. */
export function WebSignOnForm() {
  const router = useRouter();
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        router.push(routes.accounts);
      }}
      className="w-full max-w-sm justify-self-center rounded-lg bg-white p-6 shadow-raised md:justify-self-end"
    >
      <h2 className="text-xl font-semibold">Sign On</h2>
      <label className="mt-5 block text-sm font-semibold text-pnc-muted" htmlFor="web-user-id">
        User ID
      </label>
      <input
        id="web-user-id"
        defaultValue={customer.userIdMasked}
        autoComplete="off"
        className="mt-1 w-full rounded-md border border-pnc-line px-3 py-2.5 outline-none focus:border-pnc-link"
      />
      <label className="mt-4 block text-sm font-semibold text-pnc-muted" htmlFor="web-password">
        Password
      </label>
      <input
        id="web-password"
        type="password"
        placeholder="Any value works in this demo"
        autoComplete="off"
        className="mt-1 w-full rounded-md border border-pnc-line px-3 py-2.5 outline-none focus:border-pnc-link"
      />
      <button
        type="submit"
        className="mt-6 w-full rounded-full bg-pnc-orange py-3 font-semibold text-white hover:bg-pnc-orange-600"
      >
        Sign On
      </button>
      <a href="#" className="mt-4 block text-center text-sm font-semibold text-pnc-link hover:underline">
        Forgot User ID or Password?
      </a>
    </form>
  );
}
