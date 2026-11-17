"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/format";

export type SelectOption<T extends string> = {
  id: T;
  label: string;
  /** One line under the label, saying what the option means. */
  hint?: string;
  /** Shown at the right of the option, e.g. how many items it has. */
  count?: number;
};

/**
 * A compact pick-one menu (a select-only combobox): a pill button showing the
 * current choice, opening a short list under it. Arrow keys move, Enter or a
 * click picks, Escape or a click outside closes.
 */
export function SelectMenu<T extends string>({
  label,
  icon,
  options,
  value,
  onChange,
  className,
}: {
  /** What is being chosen; read out to screen readers with the value. */
  label: string;
  icon?: ReactNode;
  options: SelectOption<T>[];
  value: T;
  onChange: (id: T) => void;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const wrap = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const id = useId();
  const current = options.find((o) => o.id === value) ?? options[0];

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!wrap.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("pointerdown", onDown);
    return () => window.removeEventListener("pointerdown", onDown);
  }, [open]);

  const show = () => {
    setActive(
      Math.max(
        0,
        options.findIndex((o) => o.id === value),
      ),
    );
    setOpen(true);
  };
  const choose = (i: number) => {
    onChange(options[i].id);
    setOpen(false);
    button.current?.focus();
  };
  const onKey = (e: KeyboardEvent) => {
    if (!open) {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) {
        e.preventDefault();
        show();
      }
      return;
    }
    if (e.key === "Escape" || e.key === "Tab") {
      if (e.key === "Escape") e.preventDefault();
      setOpen(false);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, options.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Home" || e.key === "End") {
      e.preventDefault();
      setActive(e.key === "Home" ? 0 : options.length - 1);
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      choose(active);
    }
  };

  return (
    <div ref={wrap} className={cn("relative shrink-0", className)}>
      <button
        ref={button}
        type="button"
        role="combobox"
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={`${id}-list`}
        aria-activedescendant={open ? `${id}-${active}` : undefined}
        onClick={() => (open ? setOpen(false) : show())}
        onKeyDown={onKey}
        className={cn(
          "inline-flex h-9 items-center gap-2 rounded-full border bg-white pl-3 pr-2.5 text-sm font-semibold text-pnc-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pnc-link",
          open || value !== options[0].id
            ? "border-pnc-link ring-2 ring-pnc-link/15"
            : "border-pnc-line hover:border-pnc-muted",
        )}
      >
        {icon}
        <span className="whitespace-nowrap">{current.label}</span>
        {current.count !== undefined && (
          <span className="tabular-nums text-pnc-muted">{current.count}</span>
        )}
        <ChevronDown
          className={cn("size-4 text-pnc-muted transition-transform", open && "rotate-180")}
          aria-hidden="true"
        />
      </button>

      {open && (
        <ul
          id={`${id}-list`}
          role="listbox"
          aria-label={label}
          className="absolute left-0 top-full z-30 mt-1.5 w-64 rounded-lg bg-white py-1.5 shadow-raised ring-1 ring-pnc-line motion-safe:animate-reveal"
        >
          {options.map((o, i) => {
            const selected = o.id === value;
            return (
              <li
                key={o.id}
                id={`${id}-${i}`}
                role="option"
                aria-selected={selected}
                onPointerEnter={() => setActive(i)}
                onClick={() => choose(i)}
                className={cn(
                  "flex cursor-pointer items-start gap-2.5 px-3 py-2",
                  i === active && "bg-pnc-surface",
                )}
              >
                <Check
                  className={cn(
                    "mt-0.5 size-4 shrink-0 text-pnc-link",
                    selected ? "opacity-100" : "opacity-0",
                  )}
                  aria-hidden="true"
                />
                <span className="min-w-0 flex-1">
                  <span
                    className={cn(
                      "block text-sm font-semibold",
                      selected ? "text-pnc-link" : "text-pnc-ink",
                    )}
                  >
                    {o.label}
                  </span>
                  {o.hint && <span className="block text-xs text-pnc-muted">{o.hint}</span>}
                </span>
                {o.count !== undefined && (
                  <span className="mt-0.5 text-xs tabular-nums text-pnc-muted">{o.count}</span>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
