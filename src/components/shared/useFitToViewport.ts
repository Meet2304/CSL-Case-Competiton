"use client";

import { useEffect, type RefObject } from "react";

const GAP = 16;
const MIN = 420;
const MAX = 900;

/**
 * Sizes a sticky side panel to the part of the viewport it can occupy, so its
 * bottom (e.g. a chat's message box) is always on screen: shorter while the
 * page header is still in view, growing as the page scrolls until it sticks.
 * When the panel isn't sticky (narrow layouts) its CSS height applies.
 */
export function useFitToViewport(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let frame = 0;
    const fit = () => {
      frame = 0;
      if (getComputedStyle(el).position !== "sticky") {
        el.style.height = "";
        return;
      }
      const top = Math.max(el.getBoundingClientRect().top, GAP);
      const h = Math.min(MAX, Math.max(MIN, window.innerHeight - top - GAP));
      el.style.height = `${h}px`;
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(fit);
    };
    fit();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    const ro = new ResizeObserver(schedule);
    if (el.parentElement) ro.observe(el.parentElement);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      ro.disconnect();
    };
  }, [ref]);
}
