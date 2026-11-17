import type { CSSProperties, ReactNode } from "react";
import { ArrowUp } from "lucide-react";
import { Response } from "@/components/ai-elements/message";
import { SourceKindPill, SourceMarker } from "@/components/ai-elements/cited-sources";
import { FacetBackdrop } from "@/components/brand/FacetBackdrop";
import { FindoeLogo } from "@/components/brand/FindoeLogo";
import { PrivateBankLogo } from "@/components/brand/PncLogo";
import { PersonAvatar } from "@/components/ui/PersonAvatar";
import { rulebook } from "@/data/settlement";
import { storyPeople, type StoryPersonId, type StorySource } from "@/data/story";
import type { Source } from "@/lib/findoe/answer";
import { cn } from "@/lib/format";
import { stopIndex, type StopId } from "@/lib/story";

/** What a plate needs to draw itself: the stop the story is on. */
export type PlateProps = { at: number };

/** The story has reached this stop (or gone past it). */
export const past = (at: number, id: StopId) => at >= stopIndex(id);
/** The story is on exactly this stop. */
export const on = (at: number, id: StopId) => at === stopIndex(id);
/** The story is between two stops: at or past the first, before the second. */
export const during = (at: number, from: StopId, until: StopId) =>
  at >= stopIndex(from) && at < stopIndex(until);

const delay = (d: number) => ({ "--d": `${d}ms` }) as CSSProperties;

/** Each person's color: the glow behind their screen, their ring, the light of their scenes. */
export const personColor: Record<StoryPersonId, string> = {
  john: "var(--color-person-john)",
  maya: "var(--color-person-maya)",
  david: "var(--color-person-david)",
  alexa: "var(--color-person-alexa)",
  advisor: "var(--color-person-advisor)",
};

/**
 * Something that arrives on the canvas when `show` turns on, `d` ms later,
 * and leaves quickly when it turns off.
 */
export function Show({
  show,
  d = 0,
  from = "up",
  className,
  style,
  children,
  focus,
}: {
  show: boolean;
  d?: number;
  from?: "up" | "fade" | "left" | "right" | "scale";
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
  /** Marks this as something the camera can close in on. */
  focus?: string;
}) {
  return (
    <div
      aria-hidden={!show}
      data-on={show}
      data-from={from}
      data-focus={focus}
      className={cn("story-show", className)}
      style={{ ...delay(d), ...style }}
    >
      {children}
    </div>
  );
}

/** A press landing on a control, in the color of whoever presses it. Its parent must be positioned. */
export function Tap({ show, d = 500 }: { show: boolean; d?: number }) {
  return (
    <span
      key={String(show)}
      aria-hidden="true"
      data-on={show}
      className="story-tap"
      style={delay(d)}
    />
  );
}

/** Words being typed into a field. */
export function Typed({
  show,
  d = 0,
  children,
}: {
  show: boolean;
  d?: number;
  children: ReactNode;
}) {
  return (
    <span data-on={show} className="story-type inline-block whitespace-nowrap" style={delay(d)}>
      {children}
    </span>
  );
}

/** A style that eases to its new value `d` ms after it changes. */
export const eased = (d = 0) => delay(d);

export function Avatar({
  who,
  className,
  style,
}: {
  who: StoryPersonId;
  className?: string;
  style?: CSSProperties;
}) {
  const p = storyPeople[who];
  return (
    <span className={cn("inline-block shrink-0", className)} style={style}>
      <PersonAvatar seed={p.name} look={p.look} className="size-full ring-0" />
    </span>
  );
}

export function Card({
  className,
  children,
  style,
  focus,
}: {
  className?: string;
  children: ReactNode;
  style?: CSSProperties;
  focus?: string;
}) {
  return (
    <div
      data-focus={focus}
      className={cn(
        "rounded-2xl bg-white shadow-[0_1px_2px_rgb(16_24_40/0.06),0_2px_8px_rgb(16_24_40/0.06)]",
        className,
      )}
      style={style}
    >
      {children}
    </div>
  );
}

/** Where a fact came from: a record the bank holds, or the law. */
export function Cite({ source }: { source: StorySource }) {
  if (source.kind === "record")
    return (
      <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-pnc-blue-50 px-2.5 py-0.5 text-[13px] font-semibold text-pnc-blue-800">
        <span className="size-1.5 rounded-full bg-pnc-blue-700" />
        {source.label}
      </span>
    );
  const law = rulebook.sources[source.id];
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-law-bg px-2.5 py-0.5 text-[13px] font-semibold text-law ring-1 ring-law-line">
      <span className="size-1.5 rounded-full bg-law" />
      {law?.citation ?? source.id}
    </span>
  );
}

/** Who a screen belongs to: their picture, name and role, above it. */
export function NameTag({ who, note }: { who: StoryPersonId; note?: string }) {
  const p = storyPeople[who];
  return (
    <p className="absolute bottom-full left-1 mb-3.5 flex items-center gap-3 whitespace-nowrap">
      <Avatar
        who={who}
        className="size-9 rounded-full ring-2"
        style={{ "--tw-ring-color": personColor[who] } as CSSProperties}
      />
      <span className="font-display text-[18px] font-semibold text-pnc-navy">{p.name}</span>
      <span className="text-[16px] text-pnc-muted">{note ?? p.tag}</span>
    </p>
  );
}

/**
 * One person's screen on the canvas: their name above it and their color
 * glowing softly behind it. `quiet` drains the color from it once they have
 * died, and puts out the glow.
 */
export function Screen({
  who,
  quiet = false,
  note,
  className,
  style,
  screenClassName,
  children,
  focus,
}: {
  who: StoryPersonId;
  quiet?: boolean;
  /** Said beside the name instead of the person's role. */
  note?: string;
  className?: string;
  style?: CSSProperties;
  screenClassName?: string;
  children: ReactNode;
  focus?: string;
}) {
  return (
    <div
      data-quiet={quiet}
      data-focus={focus}
      className={cn("absolute", className)}
      style={{ "--glow": personColor[who], "--tap": personColor[who], ...style } as CSSProperties}
    >
      <div className="story-glow" />
      <NameTag who={who} note={note} />
      <div className={cn("story-screen absolute inset-0 overflow-hidden", screenClassName)}>
        {children}
      </div>
    </div>
  );
}

const customerNav = ["Home", "Assets and Debts", "Family", "Help"];
const advisorNav = ["Home", "Messages"];

/**
 * A laptop screen of the PNC Private Bank site, drawn for the story after the
 * working pages: the navy bar, the faceted blue header and the grey page
 * beneath. It fills a plate, leaving room above it for its owner's name.
 */
export function AppWindow({
  who,
  active,
  hero,
  strip,
  children,
  className,
  quiet,
  note,
  left = 100,
  width = 1400,
}: {
  who: StoryPersonId;
  active: string;
  /** The words in the blue header. */
  hero: ReactNode;
  /** Something between the bar and the header, such as a condolence. */
  strip?: ReactNode;
  children: ReactNode;
  className?: string;
  quiet?: boolean;
  note?: string;
  /** Where the window sits on its plate, and how wide it is. */
  left?: number;
  width?: number;
}) {
  const nav = who === "advisor" ? advisorNav : customerNav;
  return (
    <Screen
      who={who}
      quiet={quiet}
      note={note}
      className={cn("top-[78px] h-[792px] rounded-[22px]", className)}
      style={{ left, width }}
      screenClassName="flex flex-col rounded-[22px] bg-pnc-surface"
    >
      <header className="flex h-[64px] shrink-0 items-center gap-8 bg-pnc-navy px-10 text-white">
        <PrivateBankLogo size="sm" />
        <nav className="ml-auto flex h-full items-center gap-8 text-[15px]">
          {nav.map((n) => (
            <span
              key={n}
              className={cn(
                "relative flex h-full items-center",
                n === active ? "font-semibold" : "text-white/75",
              )}
            >
              {n}
              {n === active && (
                <span className="absolute inset-x-0 bottom-0 h-[3px] bg-pnc-orange" />
              )}
            </span>
          ))}
        </nav>
        <span className="flex items-center gap-2.5 text-[15px] font-semibold">
          {who === "advisor" ? "" : storyPeople[who].first}
          <Avatar who={who} className="size-9 rounded-full ring-2 ring-white/70" />
        </span>
      </header>
      {strip}
      <div className="relative h-[104px] shrink-0 overflow-hidden">
        <FacetBackdrop />
        <div className="relative h-full px-10 pt-6 text-white">{hero}</div>
      </div>
      <div className="relative min-h-0 flex-1 px-10 py-7">{children}</div>
    </Screen>
  );
}

/** The words in a blue header. Several can share one header and cross-fade. */
export function Hero({
  show = true,
  title,
  sub,
}: {
  show?: boolean;
  title: ReactNode;
  sub?: ReactNode;
}) {
  return (
    <Show show={show} from="fade" d={show ? 250 : 0} className="absolute inset-x-10 top-5">
      <h2 className="font-display text-[34px] font-medium leading-tight">{title}</h2>
      {sub && <p className="mt-0.5 text-[15px] text-white/80">{sub}</p>}
    </Show>
  );
}

/** A phone, drawn for the story, with the mobile app's blue header. */
export function Phone({
  who,
  title,
  className,
  style,
  children,
  focus,
  quiet,
}: {
  who: StoryPersonId;
  title: ReactNode;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
  focus?: string;
  quiet?: boolean;
}) {
  return (
    <Screen
      who={who}
      quiet={quiet}
      focus={focus}
      className={cn("h-[720px] w-[350px] rounded-[46px]", className)}
      style={style}
      screenClassName="rounded-[46px] bg-pnc-surface ring-[9px] ring-pnc-navy"
    >
      <div className="relative h-[170px] overflow-hidden">
        <FacetBackdrop />
        <div className="relative flex items-center justify-between px-8 pt-5 text-[13px] font-semibold text-white">
          <span>9:41</span>
          <span className="h-[24px] w-[90px] rounded-full bg-pnc-navy" />
          <span className="h-2.5 w-4 rounded-sm bg-white/90" />
        </div>
        <div className="relative mt-6 flex items-center gap-3 px-7 text-white">
          <Avatar who={who} className="size-11 rounded-full ring-2 ring-white/70" />
          <p className="font-display text-[22px] font-medium">{title}</p>
        </div>
      </div>
      <div className="relative px-5 pt-4">{children}</div>
    </Screen>
  );
}

/**
 * Findoe's panel, as the app draws it: its name and what it searches, the
 * conversation with the newest turn at the bottom, and the question box.
 */
export function FindoePanel({
  children,
  typed,
  typing = false,
  sendTap = false,
  thinking = false,
  records = "your PNC records",
  className,
  focus,
}: {
  children: ReactNode;
  /** Words in the question box. */
  typed?: string;
  /** The words are being typed now. */
  typing?: boolean;
  /** Send is being pressed now. */
  sendTap?: boolean;
  thinking?: boolean;
  /** What the bank's records are called for this reader. */
  records?: string;
  className?: string;
  focus?: string;
}) {
  return (
    <div
      data-focus={focus}
      className={cn(
        "flex flex-col overflow-hidden rounded-2xl bg-white shadow-[0_24px_60px_-30px_rgb(11_35_64/0.45)] ring-1 ring-pnc-line",
        className,
      )}
    >
      <div className="flex shrink-0 items-center gap-3 border-b border-pnc-line px-5 py-3.5">
        <FindoeLogo className="size-9" thinking={thinking} />
        <div className="leading-tight">
          <p className="font-display text-[17px] font-semibold text-pnc-ink">Findoe</p>
          <p className="text-[13px] text-pnc-muted">Simulated · {records} + legal library</p>
        </div>
      </div>
      <div className="flex min-h-0 flex-1 flex-col justify-end gap-4 overflow-hidden px-5 py-4">
        {children}
      </div>
      <div className="shrink-0 border-t border-pnc-line px-3 pb-3 pt-2.5">
        <div className="rounded-xl px-3.5 py-2.5 ring-1 ring-pnc-line">
          <p className="h-[22px] overflow-hidden text-[15px] text-pnc-ink">
            {typed ? (
              <Typed show={typing} d={600}>
                {typed}
              </Typed>
            ) : (
              <span className="text-pnc-muted">Ask about your accounts, a will, next steps…</span>
            )}
          </p>
          <div className="mt-2 flex items-center gap-1.5">
            <SourceKindPill kind="bank" label="PNC records" className="py-0.5" />
            <SourceKindPill kind="law" label="Legal library" className="py-0.5" />
            <span className="relative ml-auto grid size-8 place-items-center rounded-full bg-pnc-navy text-white">
              <ArrowUp className="size-4" aria-hidden="true" />
              <Tap show={sendTap} d={1900} />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/** A question asked of Findoe. */
export function Asked({ children }: { children: ReactNode }) {
  return (
    <div className="flex justify-end">
      <p className="max-w-[85%] rounded-2xl rounded-br-md bg-pnc-navy px-4 py-2.5 text-[15px] leading-relaxed text-white">
        {children}
      </p>
    </div>
  );
}

/** One of Findoe's answers, with its numbered source markers, drawn by the app's own pieces. */
export function Answer({ text, sources }: { text: string; sources: Source[] }) {
  return (
    <div className="flex gap-3">
      <FindoeLogo className="mt-0.5 size-6" />
      <div className="min-w-0 flex-1 text-[15px] leading-relaxed text-pnc-ink">
        <Response text={text} cite={(n) => <SourceMarker n={n} source={sources[n - 1]} />} />
      </div>
    </div>
  );
}
