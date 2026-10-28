"use client";

import { useEffect } from "react";
import { nextUiScale, UI_SCALE_KEY } from "@/lib/uiScale";

/**
 * Ctrl + Alt + Z (Ctrl + Option + Z on a Mac) cycles the interface through
 * normal, larger and largest (see src/lib/uiScale.ts). Renders nothing.
 */
export function UiScaleShortcut() {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      // `code`, not `key`: Option changes the typed character on a Mac.
      if (!e.ctrlKey || !e.altKey || e.shiftKey || e.metaKey || e.code !== "KeyZ") return;
      e.preventDefault();
      const root = document.documentElement;
      const next = nextUiScale(root.dataset.scale);
      if (next) root.dataset.scale = next;
      else delete root.dataset.scale;
      try {
        if (next) localStorage.setItem(UI_SCALE_KEY, next);
        else localStorage.removeItem(UI_SCALE_KEY);
      } catch {}
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  return null;
}
