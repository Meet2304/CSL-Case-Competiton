"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Mrs_Saint_Delafield } from "next/font/google";
import { BadgeCheck, ChevronDown } from "lucide-react";
import { buttonClass } from "@/components/will/ui";
import { cn, formatDate } from "@/lib/format";

/** A handwriting face for the testator's signature, once the will is verified. */
const signatureFont = Mrs_Saint_Delafield({ weight: "400", subsets: ["latin"] });

/** Who signed the will and on what day (ISO date): draws their signature and PNC's stamp. */
export type WillSignature = { by: string; on: string };

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
  onFile = false,
  underReview = false,
  signed,
}: {
  text: string;
  /** Show the opening of the will with a "Read the full will" toggle. */
  collapsible?: boolean;
  /** The copy kept with PNC once the will is signed, rather than a draft. */
  onFile?: boolean;
  /** The signed copy PNC is still reviewing (with `onFile`). */
  underReview?: boolean;
  /** Signs the testator's line and stamps the will as verified by PNC. */
  signed?: WillSignature;
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
                  className={cn(
                    "mb-8 rounded-md px-3 py-2 text-center text-xs font-semibold",
                    !onFile
                      ? "bg-mock-bg text-mock"
                      : underReview
                        ? "bg-pnc-blue-50 text-pnc-blue-800"
                        : "bg-pnc-positive-bg text-pnc-positive",
                  )}
                >
                  {!onFile
                    ? "Draft preview. Not a legal document until it's printed, signed and witnessed."
                    : underReview
                      ? "The signed copy with PNC for review. Your signed original is the legal document."
                      : "The copy on file with PNC. Your signed original is the legal document."}
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
                <p key={i} className="mb-1 pl-5 text-md leading-7">
                  {b.text}
                </p>
              );
            case "signature":
              return <SignatureLine key={i} label={b.text} signed={signed} />;
            case "footer":
              return (
                <p key={i} className="mt-10 text-center text-xs text-pnc-muted">
                  {b.text}
                </p>
              );
            default:
              return (
                <p key={i} className="mb-3 text-md leading-7">
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

/**
 * The testator's signature rule. Once the will is verified it is signed and
 * stamped, played in when the line comes into view so the moment isn't missed.
 */
function SignatureLine({ label, signed }: { label: string; signed?: WillSignature }) {
  const ref = useRef<HTMLDivElement>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!signed || seen || !el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setSeen(true);
      },
      { threshold: 0.6 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [signed, seen]);
  const show = signed && seen;
  return (
    <div ref={ref} data-will-signature className="mt-10 flex flex-wrap items-end gap-x-10 gap-y-6">
      <div className="w-64 max-w-full">
        <span className="relative block border-b border-pnc-ink/60 pb-6">
          {show && <Signature name={signed.by} />}
        </span>
        <span className="mt-1 block text-xs text-pnc-muted">{label}</span>
      </div>
      {/* Until it plays, an invisible stamp holds its place so the page doesn't shift. */}
      {signed && <VerifiedStamp key={show ? "stamp" : "space"} on={signed.on} hidden={!show} />}
    </div>
  );
}

/** The testator's name in a hand, written on from left to right as it appears. */
function Signature({ name }: { name: string }) {
  return (
    <span
      role="img"
      aria-label={`Signed by ${name}`}
      className={cn(
        signatureFont.className,
        "absolute -bottom-1 left-10 whitespace-nowrap text-[2.75rem] leading-none text-pnc-blue-900",
        "[clip-path:inset(-40%_-12%_-40%_-12%)] starting:[clip-path:inset(-40%_100%_-40%_-12%)]",
        "transition-[clip-path] delay-150 duration-700 ease-out motion-reduce:transition-none",
      )}
    >
      {name}
    </span>
  );
}

/** PNC's verification stamp, pressed onto the page beside the signature. */
function VerifiedStamp({ on, hidden = false }: { on: string; hidden?: boolean }) {
  return (
    <div
      aria-hidden={hidden || undefined}
      className={cn(
        hidden && "invisible",
        "-rotate-6 rounded-md border-[3px] border-pnc-orange-600 p-0.5 text-pnc-orange-600 mix-blend-multiply",
        "transition-[opacity,scale] delay-700 duration-300 ease-out starting:scale-115 starting:opacity-0 motion-reduce:transition-none",
      )}
    >
      <div className="rounded-[3px] border border-pnc-orange-600/70 px-4 py-1.5 text-center">
        <p className="flex items-center justify-center gap-1.5 font-display text-base font-bold tracking-[0.18em]">
          <BadgeCheck className="size-4" strokeWidth={2.5} aria-hidden="true" />
          VERIFIED · PNC
        </p>
        <p className="mt-0.5 text-[0.6875rem] font-semibold tracking-[0.2em]">
          {formatDate(on, "medium").toUpperCase()}
        </p>
      </div>
    </div>
  );
}

const titleCase = (upper: string) =>
  upper.replace(/\b(\w)(\w*)/g, (_, a: string, r: string) => a + r.toLowerCase());
