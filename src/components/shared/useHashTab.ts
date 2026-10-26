"use client";

import { useSyncExternalStore } from "react";

function subscribe(onChange: () => void) {
  window.addEventListener("hashchange", onChange);
  return () => window.removeEventListener("hashchange", onChange);
}

/**
 * A tab selection kept in the URL hash (e.g. `/advisor/clients/c-1#loss`), so
 * other pages can link straight to a tab and Back works. The server always
 * renders the first tab; the browser switches after hydration.
 */
export function useHashTab<T extends string>(ids: readonly T[]): [T, (id: T) => void] {
  const hash = useSyncExternalStore(
    subscribe,
    () => window.location.hash.slice(1),
    () => "",
  );
  const setTab = (id: T) => {
    const url = id === ids[0] ? window.location.pathname : `#${id}`;
    window.history.replaceState(null, "", url);
    window.dispatchEvent(new HashChangeEvent("hashchange"));
  };
  return [(ids as readonly string[]).includes(hash) ? (hash as T) : ids[0], setTab];
}
