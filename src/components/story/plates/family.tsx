import { Landmark, Umbrella, Wallet, CreditCard, PiggyBank, TrendingUp } from "lucide-react";
import { FindoeLogo } from "@/components/brand/FindoeLogo";
import { PrivateBankLogo } from "@/components/brand/PncLogo";
import { MockBadge } from "@/components/mock/Mock";
import { Money } from "@/components/ui/Money";
import {
  carried,
  familyIds,
  familyTotals,
  lossFacts,
  storyAccounts,
  storyPeople,
  word,
  closing,
  type StoryAccountId,
  type StoryPersonId,
} from "@/data/story";
import { cn, formatDate } from "@/lib/format";
import { Avatar, Show, during, eased, on, past, type PlateProps } from "../parts";

const icons: Record<StoryAccountId, typeof Wallet> = {
  joint: Wallet,
  savings: PiggyBank,
  ira: Landmark,
  brokerage: TrendingUp,
  life: Umbrella,
  card: CreditCard,
  mayaSavings: PiggyBank,
  mayaRoth: Landmark,
};

/** Where each person stands on the plate (centre x), and how large they are drawn. */
const spots: Record<StoryPersonId, { x: number; size: number }> = {
  john: { x: 500, size: 132 },
  maya: { x: 700, size: 132 },
  david: { x: 900, size: 114 },
  alexa: { x: 1100, size: 106 },
  advisor: { x: 1420, size: 114 },
};
const ROW = 470;
const CARD = { w: 260, h: 80 };
/** Where the loose accounts gather once the family is on Findoe. */
const GATHER = { x: 800, y: 700 };

/**
 * The middle of the canvas: the family itself. The story opens here, comes
 * back here when the family is ready, and is here when John dies.
 */
export function FamilyPlate({ at }: PlateProps) {
  const title = on(at, "title");
  const people = past(at, "smiths");
  const carrying = during(at, "carries", "together");
  const gathered = past(at, "together");
  const lost = past(at, "loss");
  const told = past(at, "word");
  const advisorHere = past(at, "together");
  const years = `${lossFacts.born.slice(0, 4)} – ${lossFacts.died.slice(0, 4)}`;

  return (
    <>
      {/* The opening card. */}
      <Show
        show={title}
        from="scale"
        d={title ? 200 : 0}
        className="absolute inset-x-0 top-[250px] flex flex-col items-center"
      >
        <PrivateBankLogo tone="dark" size="md" product={false} />
        <div className="mt-16 flex items-center gap-7">
          <FindoeLogo className="size-[120px]" />
          <span className="font-display text-[132px] font-semibold leading-none tracking-tight text-pnc-navy">
            Findoe
          </span>
        </div>
      </Show>

      {/* Ties from the advisor to each person in the family. */}
      <svg
        className="pointer-events-none absolute inset-0 size-full overflow-visible"
        aria-hidden="true"
      >
        {familyIds.map((id, i) => {
          const x = spots[id].x;
          const lit = advisorHere && !told && !(id === "john" && lost);
          return (
            <path
              key={id}
              d={`M ${spots.advisor.x} ${ROW - 64} Q ${(x + spots.advisor.x) / 2} ${230 + i * 22} ${x} ${ROW - spots[id].size / 2 - 6}`}
              pathLength={1}
              fill="none"
              strokeWidth={2.5}
              strokeLinecap="round"
              className="story-thread stroke-pnc-blue-600/35"
              data-on={lit}
              style={{ transitionDelay: lit ? `${700 + i * 160}ms` : "0ms" }}
            />
          );
        })}
        {(["maya", "children", "advisor"] as const).map((to, i) => {
          const x = to === "maya" ? spots.maya.x : to === "children" ? 1000 : spots.advisor.x;
          return (
            <path
              key={to}
              d={`M 800 352 C 800 380, ${x} 360, ${x} ${ROW - 76}`}
              pathLength={1}
              fill="none"
              strokeWidth={2.5}
              strokeLinecap="round"
              className="story-thread stroke-pnc-orange/60"
              data-on={told}
              style={{ transitionDelay: told ? `${500 + i * 260}ms` : "0ms" }}
            />
          );
        })}
        {carried.map((c) => {
          const cx = c.x + CARD.w / 2;
          const cy = c.y + CARD.h / 2;
          return (
            <line
              key={c.account}
              x1={spots.john.x}
              y1={ROW}
              x2={cx}
              y2={cy}
              strokeWidth={2}
              strokeDasharray="4 8"
              className="story-ease stroke-pnc-navy/20"
              style={{ opacity: carrying ? 1 : 0, ...eased(carrying ? 900 : 0) }}
            />
          );
        })}
      </svg>

      {/* The family. */}
      {(Object.keys(spots) as StoryPersonId[]).map((id, i) => {
        const s = spots[id];
        const p = storyPeople[id];
        const isAdvisor = id === "advisor";
        const shown = isAdvisor ? advisorHere : people;
        const dim =
          (carrying && id !== "john") || (id === "john" && lost)
            ? id === "john"
              ? 0.32
              : 0.28
            : 1;
        return (
          <Show
            key={id}
            show={shown}
            d={shown ? (isAdvisor ? 400 : 250 + i * 170) : 0}
            className="absolute flex w-[220px] flex-col items-center text-center"
            style={{ left: s.x - 110, top: ROW - s.size / 2 }}
          >
            <div
              className="story-ease flex flex-col items-center"
              style={{
                opacity: dim,
                filter: id === "john" && lost ? "grayscale(1)" : "none",
                transform: id === "john" && lost ? "translateY(-6px)" : "none",
                ...eased(lost && id === "john" ? 500 : 0),
              }}
            >
              <Avatar
                who={id}
                className="rounded-full shadow-[0_18px_40px_-16px_rgb(11_35_64/0.45)] ring-[5px] ring-white"
                style={{ width: s.size, height: s.size }}
              />
              <p className="mt-5 font-display text-[22px] font-semibold text-pnc-navy">
                {isAdvisor ? p.name : p.first}
              </p>
              <p className="text-[15px] text-pnc-muted">
                {isAdvisor ? "PNC Private Bank" : p.role}
              </p>
            </div>
          </Show>
        );
      })}

      {/* Everything John carries, loose around him, until it gathers into one family view. */}
      <div
        data-focus="carried"
        className="pointer-events-none absolute left-[40px] top-[120px] h-[660px] w-[980px]"
      />
      {carried.map((c, i) => {
        const a = storyAccounts[c.account];
        const Icon = icons[c.account];
        const dx = GATHER.x - (c.x + CARD.w / 2);
        const dy = GATHER.y - (c.y + CARD.h / 2);
        return (
          <Show
            key={c.account}
            show={carrying || (gathered && !lost)}
            d={carrying ? 500 + i * 140 : 0}
            from="scale"
            className="absolute"
            style={{ left: c.x, top: c.y, width: CARD.w, height: CARD.h }}
          >
            <div
              className="flex h-full items-center gap-3.5 rounded-2xl bg-white px-4 shadow-[0_14px_34px_-18px_rgb(11_35_64/0.45)] ring-1 ring-pnc-line"
              style={
                gathered
                  ? {
                      // Once the camera has arrived, each piece glides to one place and is gone.
                      transform: `translate(${dx}px, ${dy}px) scale(0.45)`,
                      opacity: 0,
                      transition: `transform 1.1s cubic-bezier(0.6,0,0.2,1) ${1500 + i * 70}ms, opacity 0.45s ease ${2300 + i * 70}ms`,
                    }
                  : { transform: `rotate(${c.tilt}deg)`, transition: "transform 0.6s ease" }
              }
            >
              <span className="grid size-11 shrink-0 place-items-center rounded-full bg-pnc-chip text-pnc-blue-700">
                <Icon className="size-5.5" strokeWidth={1.75} aria-hidden="true" />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-[16px] font-semibold text-pnc-ink">
                  {a.name}
                </span>
                <Money value={a.balance} className="text-[15px] text-pnc-muted" />
              </span>
            </div>
          </Show>
        );
      })}

      {/* The same accounts, now one shared view of the family. */}
      <Show
        show={gathered && !lost}
        d={gathered ? 2450 : 0}
        from="scale"
        className="absolute left-[530px] top-[640px] w-[540px]"
      >
        <div className="flex items-center gap-5 rounded-2xl bg-white px-6 py-5 shadow-[0_24px_60px_-28px_rgb(11_35_64/0.5)] ring-1 ring-pnc-line">
          <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-pnc-navy font-display text-[20px] font-semibold text-white">
            S
          </span>
          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-2 font-display text-[20px] font-semibold text-pnc-navy">
              Smith Family <MockBadge />
            </span>
            <span className="text-[15px] text-pnc-muted">
              {familyTotals.members} members · {familyTotals.shared} accounts shared
            </span>
          </span>
          <Money
            value={familyTotals.value}
            compact
            className="font-display text-[26px] font-semibold text-pnc-navy"
          />
        </div>
      </Show>

      {/* The loss. */}
      <div
        data-focus="loss-frame"
        className="pointer-events-none absolute left-[330px] top-[96px] h-[520px] w-[940px]"
      />
      <Show
        show={lost}
        from="fade"
        d={lost ? 900 : 0}
        className="absolute inset-x-0 top-[112px] text-center"
      >
        <p className="font-[Georgia,'Times_New_Roman',serif] text-[58px] leading-tight text-pnc-navy">
          {storyPeople.john.name}
        </p>
        <p className="mt-2 text-[18px] tracking-[0.4em] text-pnc-muted">{years}</p>
        <p className="mt-4 font-[Georgia,'Times_New_Roman',serif] text-[21px] italic text-pnc-muted">
          {closing.memorial}
        </p>
      </Show>

      {/* Word goes out from one record to everyone it should reach. */}
      <Show
        show={told}
        from="fade"
        d={told ? 150 : 0}
        className="absolute left-1/2 top-[316px] -translate-x-1/2"
      >
        <p className="whitespace-nowrap rounded-full bg-white px-5 py-2 text-[14px] font-semibold uppercase tracking-[0.16em] text-pnc-muted shadow-[0_8px_24px_-14px_rgb(11_35_64/0.5)] ring-1 ring-pnc-line">
          {word.record} · {formatDate(lossFacts.died, "medium")}
        </p>
      </Show>
      {(
        [
          { to: "maya", x: spots.maya.x, text: word.maya, people: ["maya"] },
          { to: "children", x: 1010, text: word.children, people: ["david", "alexa"] },
          { to: "advisor", x: spots.advisor.x, text: word.advisor, people: ["advisor"] },
        ] as const
      ).map((b, i) => (
        <Show
          key={b.to}
          show={told}
          d={told ? 1200 + i * 330 : 0}
          className="absolute top-[624px] w-[290px]"
          style={{ left: b.x - 145 }}
        >
          <div
            className={cn(
              "rounded-2xl px-5 py-4 text-[16px] leading-snug shadow-[0_18px_40px_-22px_rgb(11_35_64/0.5)] ring-1",
              b.to === "advisor"
                ? "bg-attention-bg text-pnc-ink ring-attention-line"
                : "bg-white text-pnc-ink ring-pnc-line",
            )}
          >
            {b.text}
          </div>
        </Show>
      ))}
    </>
  );
}
