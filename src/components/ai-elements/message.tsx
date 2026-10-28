import { Fragment, type ReactNode } from "react";
import { FindoeLogo } from "@/components/brand/FindoeLogo";
import { cn } from "@/lib/format";

/** One turn in the conversation. The assistant's turns carry its logo. */
export function Message({
  from,
  children,
  className,
  thinking = false,
}: {
  from: "user" | "assistant";
  children: ReactNode;
  className?: string;
  /** Animates the assistant's logo while it works. */
  thinking?: boolean;
}) {
  if (from === "user")
    return (
      <div className={cn("flex justify-end", className)}>
        <div className="max-w-[85%] whitespace-pre-line rounded-2xl rounded-br-md bg-pnc-navy px-4 py-2.5 text-md leading-relaxed text-white">
          <span className="sr-only">You: </span>
          {children}
        </div>
      </div>
    );
  return (
    <div className={cn("flex gap-3", className)}>
      <FindoeLogo className="mt-0.5 size-6" thinking={thinking} />
      <div className="min-w-0 flex-1 space-y-3 text-md leading-relaxed text-pnc-ink">
        <span className="sr-only">Findoe: </span>
        {children}
      </div>
    </div>
  );
}

/**
 * Renders the assistant's plain-text replies: paragraphs, bullet and numbered
 * lists, and **bold**. With `cite`, "[n]" markers become whatever it draws
 * (Findoe's source markers). A caret trails the text while it streams.
 */
export function Response({
  text,
  streaming = false,
  cite,
}: {
  text: string;
  streaming?: boolean;
  cite?: (n: number) => ReactNode;
}) {
  const cites = (s: string): ReactNode =>
    cite
      ? s.split(/(\[\d+\])/g).map((part, i) => {
          const n = part.match(/^\[(\d+)\]$/);
          return <Fragment key={i}>{n ? cite(Number(n[1])) : part}</Fragment>;
        })
      : s;
  const inline = (s: string): ReactNode[] =>
    s.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
      part.startsWith("**") && part.endsWith("**") ? (
        <strong key={i} className="font-semibold text-pnc-ink">
          {cites(part.slice(2, -2))}
        </strong>
      ) : (
        <Fragment key={i}>{cites(part)}</Fragment>
      ),
    );
  const blocks: ReactNode[] = [];
  let list: { ordered: boolean; items: string[] } | undefined;
  const flush = () => {
    if (!list) return;
    const Tag = list.ordered ? "ol" : "ul";
    blocks.push(
      <Tag
        key={blocks.length}
        className={cn(
          "space-y-1 pl-5 marker:text-pnc-muted",
          list.ordered ? "list-decimal" : "list-disc",
        )}
      >
        {list.items.map((item, i) => (
          <li key={i}>{inline(item)}</li>
        ))}
      </Tag>,
    );
    list = undefined;
  };
  for (const raw of text.split("\n")) {
    const line = raw.trim();
    const bullet = line.match(/^(?:[-*•])\s+(.*)$/);
    const numbered = line.match(/^\d+[.)]\s+(.*)$/);
    if (bullet || numbered) {
      const ordered = !!numbered;
      if (list && list.ordered !== ordered) flush();
      list ??= { ordered, items: [] };
      list.items.push((bullet ?? numbered)![1]);
      continue;
    }
    flush();
    if (line) blocks.push(<p key={blocks.length}>{inline(line)}</p>);
  }
  flush();
  return (
    <div className="space-y-2.5">
      {blocks}
      {streaming && (
        <span
          aria-hidden="true"
          className="-mt-1 inline-block h-4 w-1.5 translate-y-0.5 rounded-sm bg-pnc-ink/60 motion-safe:animate-pulse"
        />
      )}
    </div>
  );
}
