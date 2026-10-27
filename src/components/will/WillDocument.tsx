"use client";

import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { buttonClass } from "@/components/will/ui";
import { cn } from "@/lib/format";

/**
 * The will drawn as a sheet of paper: the one bold element of the will
 * experience. `WillDocument` typesets the generated draft; `WillTakingShape`
 * shows the same sheet filling in, section by section, while it's planned.
 */

type Block =
  | { kind: "notice" | "title" | "para" | "item" | "footer"; text: string }
  | { kind: "heading"; text: string; level: 1 | 2 }
  | { kind: "signature"; text: string };

const sentenceCase = (s: string) => s.charAt(0) + s.slice(1).toLowerCase();

/** Turns `generateWill` output into typeset blocks (its line format is ours to rely on). */
function parse(text: string): Block[] {
  const blocks: Block[] = [];
  for (const raw of text.split("\n")) {
    const line = raw.trimEnd();
    if (!line.trim()) continue;
    // The name printed under a signature rule belongs to that signature.
    const last = blocks.at(-1);
    if (last?.kind === "signature" && !last.text) {
      last.text = line;
      continue;
    }
    const article = line.match(/^ARTICLE ([IVXL]+) — (.+)$/);
    if (line.startsWith("DRAFT PREVIEW")) blocks.push({ kind: "notice", text: line });
    else if (line.startsWith("LAST WILL AND TESTAMENT OF")) {
      blocks.push({ kind: "title", text: line.replace("LAST WILL AND TESTAMENT OF ", "") });
    } else if (article) {
      blocks.push({
        kind: "heading",
        level: 1,
        text: `${article[1]}. ${sentenceCase(article[2])}`,
      });
    } else if (/^[A-Z][A-Z -]+(?: —.*)?$/.test(line) && line === line.toUpperCase()) {
      blocks.push({ kind: "heading", level: 2, text: sentenceCase(line) });
    } else if (/^(SCHEDULE|ATTACHMENT) /.test(line)) {
      const [head, rest = ""] = line.split(" — ");
      blocks.push({ kind: "heading", level: 2, text: `${titleCase(head)}: ${sentenceCase(rest)}` });
    } else if (/^_{6,}$/.test(line.trim())) blocks.push({ kind: "signature", text: "" });
    else if (/^\s+\d+\. /.test(raw)) blocks.push({ kind: "item", text: line.trim() });
    else if (line.startsWith("Draft generated")) blocks.push({ kind: "footer", text: line });
    else blocks.push({ kind: "para", text: line });
  }
  return blocks;
}

/** Underscore runs become real signature rules. */
function withRules(text: string): ReactNode {
  const parts = text.split(/(_{4,})/);
  return parts.map((p, i) =>
    /^_{4,}$/.test(p) ? (
      <span
        key={i}
        aria-label="blank"
        className="mx-1 inline-block w-28 border-b border-pnc-ink/50 align-baseline @2xl:w-40"
      />
    ) : (
      p
    ),
  );
}

function Sheet({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <article
      className={cn(
        "relative mx-auto w-full max-w-[46rem] overflow-hidden rounded-sm bg-white px-6 py-8 text-pnc-ink shadow-raised ring-1 ring-pnc-line @2xl:px-14 @2xl:py-12",
        className,
      )}
    >
      {children}
    </article>
  );
}

export function WillDocument({
  text,
  collapsible = false,
}: {
  text: string;
  /** Show the opening of the will with a "Read the full will" toggle. */
  collapsible?: boolean;
}) {
  const [open, setOpen] = useState(!collapsible);
  const blocks = parse(text);

  return (
    <div className="@container">
      <Sheet className={cn(!open && "max-h-[30rem]")}>
        {blocks.map((b, i) => {
          switch (b.kind) {
            case "notice":
              return (
                <p
                  key={i}
                  className="mb-8 rounded-md bg-mock-bg px-3 py-2 text-center text-xs font-semibold text-mock"
                >
                  Draft preview. Not a legal document until it&apos;s printed, signed and witnessed.
                </p>
              );
            case "title":
              return (
                <header key={i} className="mb-8 text-center">
                  <p className="font-display text-sm font-medium text-pnc-muted">
                    Last Will and Testament of
                  </p>
                  <h3 className="mt-1 font-display text-2xl font-semibold tracking-tight @2xl:text-3xl">
                    {titleCase(b.text)}
                  </h3>
                </header>
              );
            case "heading":
              return b.level === 1 ? (
                <h4 key={i} className="mb-2 mt-7 font-display text-base font-semibold">
                  {b.text}
                </h4>
              ) : (
                <h4
                  key={i}
                  className="mb-2 mt-9 border-t border-pnc-line pt-5 font-display text-sm font-semibold"
                >
                  {b.text}
                </h4>
              );
            case "item":
              return (
                <p key={i} className="mb-1 pl-5 text-[15px] leading-7">
                  {b.text}
                </p>
              );
            case "signature":
              return (
                <div key={i} className="mt-10 w-64 max-w-full">
                  <span className="block border-b border-pnc-ink/60 pb-6" />
                  <span className="mt-1 block text-xs text-pnc-muted">{b.text}</span>
                </div>
              );
            case "footer":
              return (
                <p key={i} className="mt-10 text-center text-xs text-pnc-muted">
                  {b.text}
                </p>
              );
            default:
              return (
                <p key={i} className="mb-3 text-[15px] leading-7">
                  {withRules(b.text)}
                </p>
              );
          }
        })}
        {!open && (
          <div className="absolute inset-x-0 bottom-0 flex h-36 items-end justify-center bg-linear-to-t from-white via-white/95 to-transparent pb-6">
            <button type="button" onClick={() => setOpen(true)} className={buttonClass.secondary}>
              <ChevronDown className="size-4" aria-hidden="true" /> Read the full will
            </button>
          </div>
        )}
      </Sheet>
    </div>
  );
}

const titleCase = (upper: string) =>
  upper.replace(/\b(\w)(\w*)/g, (_, a: string, r: string) => a + r.toLowerCase());
