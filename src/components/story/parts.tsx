import type { CSSProperties, ReactNode } from "react";
import { FacetBackdrop } from "@/components/brand/FacetBackdrop";
import { PrivateBankLogo } from "@/components/brand/PncLogo";
import { PersonAvatar } from "@/components/ui/PersonAvatar";
import { rulebook } from "@/data/settlement";
import { storyPeople, type StoryPersonId, type StorySource } from "@/data/story";
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

/** A press landing on a control. Its parent must be positioned. */
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

const customerNav = ["Home", "Assets and Debts", "Family", "Help"];
const advisorNav = ["Home", "Messages"];

/**
 * A laptop screen of the PNC Private Bank site, drawn for the story: the navy
 * bar, the faceted blue header and the grey page beneath. It fills a plate,
 * leaving a margin of canvas around it.
 */
export function AppWindow({
  who,
  active,
  hero,
  strip,
  children,
  className,
}: {
  who: StoryPersonId;
  active: string;
  /** The words in the blue header. */
  hero: ReactNode;
  /** Something between the bar and the header, such as a condolence. */
  strip?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  const nav = who === "advisor" ? advisorNav : customerNav;
  return (
    <div
      className={cn(
        "absolute left-[100px] top-[40px] flex h-[820px] w-[1400px] flex-col overflow-hidden rounded-[22px] bg-pnc-surface shadow-[0_50px_110px_-40px_rgb(11_35_64/0.45),0_0_0_1px_rgb(11_35_64/0.06)]",
        className,
      )}
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
      <div className="relative h-[108px] shrink-0 overflow-hidden">
        <FacetBackdrop />
        <div className="relative h-full px-10 pt-6 text-white">{hero}</div>
      </div>
      <div className="relative min-h-0 flex-1 px-10 py-7">{children}</div>
    </div>
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
    <Show show={show} from="fade" d={show ? 250 : 0} className="absolute inset-x-10 top-6">
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
  children,
}: {
  who: StoryPersonId;
  title: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "absolute h-[720px] w-[350px] overflow-hidden rounded-[46px] bg-pnc-surface shadow-[0_50px_100px_-30px_rgb(11_35_64/0.5),0_0_0_10px_#0b2340,0_0_0_11px_rgb(255_255_255/0.2)]",
        className,
      )}
    >
      <div className="relative h-[170px] overflow-hidden">
        <FacetBackdrop />
        <div className="relative flex items-center justify-between px-7 pt-4 text-[13px] font-semibold text-white">
          <span>9:41</span>
          <span className="h-[26px] w-[96px] rounded-full bg-pnc-navy" />
          <span className="flex gap-1">
            <span className="h-2.5 w-4 rounded-sm bg-white/90" />
          </span>
        </div>
        <div className="relative mt-7 flex items-center gap-3 px-6 text-white">
          <Avatar who={who} className="size-11 rounded-full ring-2 ring-white/70" />
          <p className="font-display text-[22px] font-medium">{title}</p>
        </div>
      </div>
      <div className="relative px-4 pt-4">{children}</div>
    </div>
  );
}
