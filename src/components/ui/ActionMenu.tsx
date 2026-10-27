"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { EllipsisVertical, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/format";

export type MenuAction = {
  label: string;
  icon?: LucideIcon;
  onSelect: () => void;
  /** Quieter styling for housekeeping actions (e.g. "Reset demo"). */
  subtle?: boolean;
};

/**
 * A "⋮" button that opens a short menu of less frequent actions. Follows the
 * WAI-ARIA menu button pattern: arrow keys move, Escape closes and returns
 * focus, clicking outside closes.
 */
export function ActionMenu({
  label,
  actions,
  className,
}: {
  /** Accessible name of the button, e.g. "More actions". */
  label: string;
  actions: MenuAction[];
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const button = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLUListElement>(null);
  const id = useId();

  useEffect(() => {
    if (!open) return;
    menu.current?.querySelector<HTMLButtonElement>("[role=menuitem]")?.focus();
    function onDown(e: PointerEvent) {
      const t = e.target as Node;
      if (!menu.current?.contains(t) && !button.current?.contains(t)) setOpen(false);
    }
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open]);

  function close() {
    setOpen(false);
    button.current?.focus();
  }

  function onMenuKey(e: KeyboardEvent<HTMLUListElement>) {
    const items = [...(menu.current?.querySelectorAll<HTMLButtonElement>("[role=menuitem]") ?? [])];
    const at = items.indexOf(document.activeElement as HTMLButtonElement);
    const go = (i: number) => items[(i + items.length) % items.length]?.focus();
    if (e.key === "ArrowDown") go(at + 1);
    else if (e.key === "ArrowUp") go(at - 1);
    else if (e.key === "Home") go(0);
    else if (e.key === "End") go(items.length - 1);
    else if (e.key === "Escape" || e.key === "Tab") close();
    else return;
    e.preventDefault();
  }

  return (
    <div className={cn("relative", className)}>
      <button
        ref={button}
        type="button"
        aria-label={label}
        title={label}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? id : undefined}
        onClick={() => setOpen(!open)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown" && !open) {
            e.preventDefault();
            setOpen(true);
          }
        }}
        className="grid size-8 place-items-center rounded-full text-pnc-muted hover:bg-pnc-surface hover:text-pnc-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pnc-link aria-expanded:bg-pnc-surface aria-expanded:text-pnc-ink"
      >
        <EllipsisVertical className="size-4.5" aria-hidden="true" />
      </button>
      {open && (
        <ul
          ref={menu}
          id={id}
          role="menu"
          aria-label={label}
          onKeyDown={onMenuKey}
          className="absolute right-0 top-full z-40 mt-1.5 min-w-56 rounded-lg bg-white p-1 shadow-raised ring-1 ring-pnc-line motion-safe:animate-reveal"
        >
          {actions.map(({ label: text, icon: Icon, onSelect, subtle }) => (
            <li key={text} role="none">
              <button
                type="button"
                role="menuitem"
                tabIndex={-1}
                onClick={() => {
                  setOpen(false);
                  onSelect();
                }}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-sm outline-none hover:bg-pnc-surface focus-visible:bg-pnc-blue-50",
                  subtle ? "text-pnc-muted" : "font-medium text-pnc-ink",
                )}
              >
                {Icon && <Icon className="size-4 shrink-0" aria-hidden="true" />}
                {text}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
