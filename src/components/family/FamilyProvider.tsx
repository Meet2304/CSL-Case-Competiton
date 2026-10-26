"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  type ReactNode,
} from "react";
import { selfHousehold } from "@/data/bereavement";
import { initialFamilyState } from "@/data/family";
import type { FamilyState } from "@/data/types";
import { lossFor, useBereavement } from "@/lib/bereavement";
import { familyReducer, type FamilyAction } from "@/lib/family";

/**
 * Demo persistence: the family's members, roles, assets and legal processes
 * live in this browser's localStorage so admin changes survive navigation.
 * Bump the key when the shape of FamilyState changes.
 */
const STORAGE_KEY = "pnc-family-demo-v2";

type FamilyContextValue = {
  state: FamilyState;
  dispatch: (action: FamilyAction) => void;
  reset: () => void;
};

const FamilyContext = createContext<FamilyContextValue | null>(null);

function readStored(): FamilyState | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as FamilyState) : null;
  } catch {
    return null;
  }
}

export function FamilyProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(familyReducer, initialFamilyState);
  const hydrated = useRef(false);

  // Load saved changes after mount (the server render always uses the seed).
  useEffect(() => {
    const stored = readStored();
    if (stored) dispatch({ type: "hydrate", state: stored });
    hydrated.current = true;
  }, []);

  useEffect(() => {
    if (!hydrated.current) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Storage full or blocked — the demo still works for this session.
    }
  }, [state]);

  const reset = () => {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {}
    dispatch({ type: "reset", state: initialFamilyState });
  };

  // A death recorded by the bank shows here too (read-time overlay; saved family data is untouched).
  const loss = lossFor(useBereavement(), selfHousehold);
  const view = useMemo(
    () =>
      loss
        ? {
            ...state,
            members: state.members.map((m) =>
              m.name === loss.personName ? { ...m, status: "Deceased" as const } : m,
            ),
          }
        : state,
    [state, loss],
  );

  return (
    <FamilyContext.Provider value={{ state: view, dispatch, reset }}>
      {children}
    </FamilyContext.Provider>
  );
}

export function useFamily(): FamilyContextValue {
  const ctx = useContext(FamilyContext);
  if (!ctx) throw new Error("useFamily must be used inside <FamilyProvider>");
  return ctx;
}
