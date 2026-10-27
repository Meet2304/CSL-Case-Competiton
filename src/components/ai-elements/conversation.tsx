"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { ArrowDown } from "lucide-react";
import { cn } from "@/lib/format";

// Chat building blocks in the shape of shadcn's AI Elements (Conversation,
// Message, PromptInput, ChainOfThought, Tool, Sources, Suggestion), written
// against the PNC tokens instead of shadcn's theme so they match the app.

type StickContext = { atBottom: boolean; scrollToBottom: () => void };
const Stick = createContext<StickContext>({ atBottom: true, scrollToBottom: () => {} });

/**
 * A scrolling conversation that follows new content while the reader is at
 * the bottom, and stops following as soon as they scroll up to read.
 */
export function Conversation({
  children,
  className,
  label,
}: {
  children: ReactNode;
  className?: string;
  label: string;
}) {
  const viewport = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const following = useRef(true);
  const [atBottom, setAtBottom] = useState(true);

  const scrollToBottom = useCallback((smooth = true) => {
    const el = viewport.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollTo({ top: el.scrollHeight, behavior: smooth && !reduce ? "smooth" : "auto" });
    following.current = true;
  }, []);

  // New content (a message, a streamed token, a step finishing) keeps the view pinned.
  useEffect(() => {
    const ro = new ResizeObserver(() => {
      if (following.current) scrollToBottom(false);
    });
    if (content.current) ro.observe(content.current);
    return () => ro.disconnect();
  }, [scrollToBottom]);

  return (
    <Stick.Provider value={{ atBottom, scrollToBottom: () => scrollToBottom() }}>
      <div className={cn("relative min-h-0", className)}>
        <div
          ref={viewport}
          role="log"
          aria-label={label}
          tabIndex={0}
          onScroll={(e) => {
            const el = e.currentTarget;
            const bottom = el.scrollHeight - el.scrollTop - el.clientHeight < 24;
            following.current = bottom;
            setAtBottom(bottom);
          }}
          className="h-full overflow-y-auto overscroll-contain outline-none [scrollbar-color:var(--color-pnc-line)_transparent] [scrollbar-width:thin] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-pnc-link"
        >
          <div ref={content}>{children}</div>
        </div>
        <ConversationScrollButton />
      </div>
    </Stick.Provider>
  );
}

export function ConversationContent({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn("space-y-5 px-5 pb-4 pt-1", className)}>{children}</div>;
}

/** Appears when the reader has scrolled up; jumps back to the latest message. */
export function ConversationScrollButton() {
  const { atBottom, scrollToBottom } = useContext(Stick);
  if (atBottom) return null;
  return (
    <button
      type="button"
      onClick={scrollToBottom}
      aria-label="Scroll to latest message"
      className="absolute bottom-3 left-1/2 grid size-8 -translate-x-1/2 place-items-center rounded-full bg-white text-pnc-ink shadow-raised ring-1 ring-pnc-line hover:ring-pnc-muted motion-safe:animate-reveal"
    >
      <ArrowDown className="size-4" aria-hidden="true" />
    </button>
  );
}
