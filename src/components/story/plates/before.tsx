import {
  ArrowRight,
  Bell,
  Briefcase,
  Building,
  Car,
  Check,
  Clock,
  CreditCard,
  Gem,
  House,
  Landmark,
  Link2,
  Palette,
  PiggyBank,
  ScrollText,
  ShieldCheck,
  TrendingUp,
  Umbrella,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { FindoeLogo } from "@/components/brand/FindoeLogo";
import { MockBadge } from "@/components/mock/Mock";
import { Money } from "@/components/ui/Money";
import { addAssetGroups } from "@/data/addAsset";
import {
  addElsewhere,
  addTiles,
  car,
  findoe,
  johnTotals,
  johnsList,
  linked,
  lossFacts,
  named,
  reminders,
  storyAccounts,
  storyPeople,
  willFacts,
  willSteps,
  type StoryAccountId,
} from "@/data/story";
import { cn, formatDate } from "@/lib/format";
import {
  Answer,
  AppWindow,
  Asked,
  Avatar,
  Card,
  FindoePanel,
  Hero,
  Show,
  Tap,
  Typed,
  during,
  eased,
  on,
  past,
  type PlateProps,
} from "../parts";

const A = storyAccounts;
/** The years John lived, beside his name once his screens fall quiet. */
export const years = `${lossFacts.born.slice(0, 4)} – ${lossFacts.died.slice(0, 4)}`;
const label = (id: StoryAccountId) => (A[id].last4 ? `${A[id].name} x${A[id].last4}` : A[id].name);

export const accountIcons: Record<StoryAccountId, LucideIcon> = {
  joint: Wallet,
  savings: PiggyBank,
  ira: Landmark,
  brokerage: TrendingUp,
  life: Umbrella,
  card: CreditCard,
  mayaSavings: PiggyBank,
  mayaRoth: Landmark,
  alexaSavings: PiggyBank,
};

export function Chip({ icon: Icon, className }: { icon: LucideIcon; className?: string }) {
  return (
    <span
      className={cn(
        "grid size-11 shrink-0 place-items-center rounded-full bg-pnc-chip text-pnc-blue-700",
        className,
      )}
    >
      <Icon className="size-5.5" strokeWidth={1.75} aria-hidden="true" />
    </span>
  );
}

/** A layer of a window's page; several layers share the page and cross-fade. */
const layer = "absolute inset-x-10 inset-y-7";

/** Findoe's launcher, bottom right of every page, as in the app. */
function AskFindoe() {
  return (
    <span className="absolute bottom-5 right-6 flex items-center gap-2.5 rounded-full bg-pnc-navy py-2 pl-2 pr-5 text-[15px] font-semibold text-white shadow-raised">
      <FindoeLogo className="size-8" /> Ask Findoe
    </span>
  );
}

/** A side panel sliding over a page, with the page dimmed beneath it. */
function SidePanel({
  show,
  focus,
  children,
}: {
  show: boolean;
  focus: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <div
        aria-hidden="true"
        className="story-ease pointer-events-none absolute inset-0 bg-pnc-navy/25"
        style={{ opacity: show ? 1 : 0 }}
      />
      <Show
        show={show}
        from="right"
        d={show ? 250 : 0}
        focus={focus}
        className="absolute bottom-0 right-0 top-0 w-[560px] bg-white px-10 py-8 shadow-[-20px_0_60px_-30px_rgb(11_35_64/0.5)]"
      >
        {children}
      </Show>
    </>
  );
}

// ---------------------------------------------------------------------------
// John's own view: Home, then Assets and Debts.

const notes: Record<StoryAccountId, { text: string; warn?: boolean }> = {
  joint: { text: "Checking · Joint with Maya" },
  savings: { text: "Savings · No beneficiary named", warn: true },
  ira: { text: "Retirement · Beneficiary: Maya" },
  brokerage: { text: "Investments · No beneficiary named", warn: true },
  life: { text: "Life insurance · Beneficiary: Maya" },
  card: { text: "Credit card" },
  mayaSavings: { text: "" },
  mayaRoth: { text: "" },
  alexaSavings: { text: "" },
};

export function JohnPlate({ at }: PlateProps) {
  const assets = past(at, "assets");
  const outside = past(at, "outside");
  const enter = on(at, "home") ? 1100 : 250;
  return (
    <AppWindow
      who="john"
      quiet={past(at, "loss")}
      note={past(at, "loss") ? years : undefined}
      active={assets ? "Assets and Debts" : "Home"}
      hero={
        <>
          <Hero show={!assets} title="Welcome, John" />
          <Hero
            show={assets}
            title="Assets and Debts"
            sub="Everything you own and owe, in one place."
          />
        </>
      }
    >
      <Show show={!assets} d={enter} from="fade" className={cn(layer, "flex gap-7")}>
        <div className="flex w-[860px] flex-col gap-6">
          <Card className="p-7">
            <div className="flex items-center justify-between">
              <p className="font-display text-[22px] font-semibold text-pnc-navy">
                Portfolio Summary
              </p>
              <MockBadge />
            </div>
            <div className="mt-6 grid grid-cols-4 gap-6">
              {(
                [
                  ["PNC Assets", johnTotals.pncAssets],
                  ["PNC Debts", johnTotals.debts],
                  ["External Accounts", johnTotals.external],
                  ["Net Value", johnTotals.net],
                ] as const
              ).map(([name, value], i) => (
                <Show key={name} show={!assets} d={enter + 250 + i * 120}>
                  <p className="text-[14px] text-pnc-muted">{name}</p>
                  <Money
                    value={value}
                    className="mt-1 block font-display text-[24px] font-semibold text-pnc-ink"
                  />
                </Show>
              ))}
            </div>
          </Card>
          <Card className="flex items-center gap-5 p-6">
            <span className="grid size-12 place-items-center rounded-xl bg-pnc-navy font-display text-[20px] font-semibold text-white">
              S
            </span>
            <div className="flex-1">
              <p className="text-[18px] font-semibold text-pnc-ink">Smith Family</p>
              <p className="text-[15px] text-pnc-muted">4 members · Admin</p>
            </div>
            <div className="flex -space-x-2">
              {(["john", "maya", "david", "alexa"] as const).map((p) => (
                <Avatar key={p} who={p} className="size-10 rounded-full ring-2 ring-white" />
              ))}
            </div>
          </Card>
          <Card className="flex items-center gap-5 p-6">
            <Avatar who="advisor" className="size-14 rounded-full" />
            <div className="flex-1">
              <p className="text-[13px] font-semibold uppercase tracking-wide text-pnc-muted">
                My team
              </p>
              <p className="text-[18px] font-semibold text-pnc-ink">{storyPeople.advisor.name}</p>
              <p className="text-[15px] text-pnc-muted">{storyPeople.advisor.role}</p>
            </div>
          </Card>
        </div>
        <Card className="h-fit flex-1 p-7">
          <div className="flex items-center gap-2.5">
            <Bell className="size-5 text-pnc-blue-700" aria-hidden="true" />
            <p className="font-display text-[20px] font-semibold text-pnc-navy">Notifications</p>
            <span className="ml-auto grid size-7 place-items-center rounded-full bg-pnc-chip text-[13px] font-semibold">
              {reminders.length}
            </span>
          </div>
          <ul className="mt-5 space-y-5">
            {reminders.map((r) => (
              <li key={r.id} className="flex gap-3.5">
                <span className="mt-1.5 size-2.5 shrink-0 rounded-full bg-pnc-orange" />
                <span>
                  <span className="block text-[16px] font-semibold text-pnc-ink">{r.title}</span>
                  <span className="text-[15px] leading-snug text-pnc-muted">{r.body}</span>
                </span>
              </li>
            ))}
          </ul>
        </Card>
      </Show>

      <Show show={assets} d={assets ? 350 : 0} from="fade" className={cn(layer, "flex gap-7")}>
        <Card className="h-fit w-[370px] p-7">
          <div className="flex items-center justify-between">
            <p className="text-[16px] text-pnc-muted">What you own</p>
            <MockBadge />
          </div>
          <Money
            value={johnTotals.net}
            className="mt-2 block font-display text-[40px] font-semibold text-pnc-ink"
          />
          <p className="mt-2 text-[15px] leading-snug text-pnc-muted">
            Across 5 accounts at PNC, plus a life policy held outside PNC
          </p>
          <div className="mt-5 flex h-2.5 overflow-hidden rounded-full">
            <span className="w-[12%] bg-chart-cash" />
            <span className="w-[47%] bg-chart-retirement" />
            <span className="flex-1 bg-chart-investments" />
          </div>
        </Card>
        <Card className="h-fit flex-1 overflow-hidden">
          <div className="flex items-center gap-7 border-b border-pnc-line px-7 pt-5 text-[16px]">
            <span className="border-b-[3px] border-pnc-orange pb-3.5 font-semibold">
              Assets <span className="ml-1 rounded-full bg-pnc-chip px-2 text-[13px]">5</span>
            </span>
            <span className="pb-3.5 text-pnc-muted">
              Debts <span className="ml-1 rounded-full bg-pnc-chip px-2 text-[13px]">1</span>
            </span>
            <span className="ml-auto mb-3 rounded-full bg-pnc-blue-700 px-4 py-1.5 text-[14px] font-semibold text-white">
              + Add asset
            </span>
          </div>
          <ul>
            {johnsList.map((id, i) => {
              const life = id === "life";
              const n = notes[id];
              return (
                <Show key={id} show={assets} d={assets ? 600 + i * 110 : 0}>
                  <li
                    data-focus={life ? "life-row" : undefined}
                    className={cn(
                      "story-ease flex items-center gap-4 border-b border-pnc-line px-7 py-[14px] last:border-b-0",
                      life &&
                        outside &&
                        "bg-pnc-orange/[0.07] shadow-[inset_4px_0_0_var(--color-pnc-orange)]",
                    )}
                    style={eased(outside ? 500 : 0)}
                  >
                    <Chip icon={accountIcons[id]} />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2.5 text-[18px] font-semibold text-pnc-link">
                        {A[id].name}
                        {A[id].last4 && (
                          <span className="text-[14px] font-normal text-pnc-muted">
                            x{A[id].last4}
                          </span>
                        )}
                        {life && (
                          <span className="rounded-full bg-pnc-orange/12 px-2.5 py-0.5 text-[13px] font-semibold text-pnc-orange-600">
                            Outside PNC
                          </span>
                        )}
                      </span>
                      <span
                        className={cn(
                          "text-[15px]",
                          n.warn ? "text-pnc-orange-600" : "text-pnc-muted",
                        )}
                      >
                        {n.text}
                      </span>
                    </span>
                    <Money
                      value={A[id].balance}
                      className="font-display text-[21px] font-semibold text-pnc-ink"
                    />
                  </li>
                </Show>
              );
            })}
          </ul>
        </Card>
      </Show>
      <AskFindoe />
    </AppWindow>
  );
}

// ---------------------------------------------------------------------------
// Getting ready: everything that counts, and no gaps left for the family.

const addIcons: Record<string, LucideIcon> = {
  "pnc-deposit": Wallet,
  "pnc-investments": TrendingUp,
  "pnc-retirement": Landmark,
  "pnc-trust": ShieldCheck,
  banks: Building,
  workplace: Briefcase,
  insurance: Umbrella,
  "real-estate": House,
  vehicles: Car,
  jewelry: Gem,
  art: Palette,
};

const groups = [
  { label: "PNC accounts", options: addAssetGroups[0].options.slice(0, 4) },
  { label: "External accounts", options: addElsewhere },
  { label: "Add your own", options: addTiles },
];

const money = (n: number) => `$${n.toLocaleString("en-US")}`;

export function PreparePlate({ at }: PlateProps) {
  const adding = !past(at, "gaps");
  const linking = during(at, "linked", "car");
  const form = during(at, "car", "gaps");
  const gaps = past(at, "gaps");
  const fixed = past(at, "named");
  const enter = on(at, "add") ? 1100 : 250;
  const ask = findoe.johnBefore;
  return (
    <AppWindow
      who="john"
      quiet={past(at, "loss")}
      note={past(at, "loss") ? years : undefined}
      active={adding ? "Assets and Debts" : "Home"}
      hero={
        <>
          <Hero
            show={adding}
            title="Add an asset"
            sub="Bring everything you own into one view, wherever it's held."
          />
          <Hero show={gaps} title="Welcome, John" />
        </>
      }
    >
      <Show show={adding} d={enter} from="fade" className={cn(layer, "space-y-6")}>
        {groups.map((g, gi) => (
          <div key={g.label}>
            <p className="font-display text-[19px] font-semibold text-pnc-navy">{g.label}</p>
            <div className="mt-3 grid grid-cols-4 gap-4">
              {g.options.map((o, i) => {
                const picked =
                  (o.id === "banks" && past(at, "linked")) ||
                  (o.id === "vehicles" && past(at, "car"));
                return (
                  <Show key={o.id} show={adding} d={adding ? enter + 200 + gi * 200 + i * 70 : 0}>
                    <Card
                      className={cn(
                        "story-ease relative flex h-[112px] gap-3.5 p-5",
                        picked && "ring-2 ring-pnc-blue-600",
                      )}
                    >
                      <Chip icon={addIcons[o.id] ?? Wallet} />
                      <span className="min-w-0">
                        <span className="block text-[16px] font-semibold text-pnc-ink">
                          {o.label}
                        </span>
                        <span className="mt-1 line-clamp-2 block text-[14px] leading-snug text-pnc-muted">
                          {o.description}
                        </span>
                      </span>
                      {o.id === "banks" && <Tap show={on(at, "linked")} d={150} />}
                      {o.id === "vehicles" && <Tap show={on(at, "car")} d={150} />}
                    </Card>
                  </Show>
                );
              })}
            </div>
          </div>
        ))}
      </Show>

      {/* An account at another institution, linked in one step. */}
      <SidePanel show={linking} focus="linked-form">
        <div className="flex items-center gap-4">
          <Chip icon={Building} className="size-14" />
          <div>
            <p className="font-display text-[26px] font-semibold text-pnc-navy">
              {linked.option.label}
            </p>
            <p className="text-[15px] text-pnc-muted">{linked.option.description}</p>
          </div>
        </div>
        <div className="mt-7 flex items-center gap-3 rounded-xl bg-pnc-surface px-4 py-3 text-[16px]">
          <Link2 className="size-5 text-pnc-blue-700" aria-hidden="true" />
          <span className="font-semibold">{linked.institution}</span>
          <Show show={linking} d={linking ? 1300 : 0} from="fade" className="ml-auto">
            <span className="flex items-center gap-1.5 text-[14px] font-semibold text-pnc-positive">
              <Check className="size-4" aria-hidden="true" /> Connected
            </span>
          </Show>
        </div>
        <Show show={linking} d={linking ? 1800 : 0} className="mt-6">
          <p className="font-semibold text-pnc-ink">Found at {linked.institution}</p>
          <ul className="mt-3 space-y-2.5">
            {linked.found.map((f) => (
              <li
                key={f.last4}
                className="flex items-center gap-3.5 rounded-xl px-4 py-3.5 ring-1 ring-pnc-line"
              >
                <span className="grid size-5 place-items-center rounded bg-pnc-blue-700 text-white">
                  <Check className="size-3.5" aria-hidden="true" />
                </span>
                <span className="flex-1 text-[16px]">
                  <span className="font-semibold">{f.name}</span>{" "}
                  <span className="text-pnc-muted">x{f.last4}</span>
                </span>
                <Money value={f.balance} className="text-[16px] font-semibold" />
              </li>
            ))}
          </ul>
        </Show>
        <Show show={linking} d={linking ? 2500 : 0} className="mt-7">
          <span className="relative inline-flex h-[52px] items-center gap-2 rounded-full bg-pnc-blue-700 px-7 text-[17px] font-semibold text-white">
            Add {linked.found.length} accounts{" "}
            <ArrowRight className="size-4.5" aria-hidden="true" />
            <Tap show={linking} d={3200} />
          </span>
        </Show>
      </SidePanel>

      {/* A car is asked for what identifies a car, nothing else. */}
      <SidePanel show={form} focus="car-form">
        <div className="flex items-center gap-4">
          <Chip icon={Car} className="size-14" />
          <div>
            <p className="font-display text-[26px] font-semibold text-pnc-navy">
              {car.option.label}
            </p>
            <p className="text-[15px] text-pnc-muted">{car.option.description}</p>
          </div>
        </div>
        <p className="mt-8 text-[17px] font-semibold text-pnc-ink">{car.option.ask?.title}</p>
        <div className="mt-4 space-y-4">
          {car.option.ask?.fields.map((f, i) => (
            <label key={f.id} className="block">
              <span className="text-[14px] font-semibold text-pnc-muted">{f.label}</span>
              <span className="mt-1.5 flex h-[52px] items-center rounded-xl px-4 text-[18px] text-pnc-ink ring-1 ring-pnc-line">
                <Typed show={form} d={900 + i * 1000}>
                  {car.answers[f.id]}
                </Typed>
              </span>
            </label>
          ))}
        </div>
        <Show show={form} d={form ? 2900 : 0} className="mt-7 rounded-2xl bg-pnc-blue-50 p-5">
          <p className="text-[14px] font-semibold uppercase tracking-wide text-pnc-blue-800">
            Estimated value
          </p>
          <p className="mt-1 font-display text-[34px] font-semibold text-pnc-navy">
            {money(car.value)}
          </p>
          <p className="text-[15px] text-pnc-muted">
            Likely between {money(car.low)} and {money(car.high)}
          </p>
        </Show>
        <Show show={form} d={form ? 3400 : 0} className="mt-6">
          <span className="relative inline-flex h-[52px] items-center gap-2 rounded-full bg-pnc-blue-700 px-7 text-[17px] font-semibold text-white">
            Add to Assets and Debts <ArrowRight className="size-4.5" aria-hidden="true" />
            <Tap show={form} d={4100} />
          </span>
        </Show>
      </SidePanel>

      {/* Home again: the reminders, and Findoe on what would happen today. */}
      <Show
        show={gaps}
        d={gaps ? 300 : 0}
        from="fade"
        className="absolute inset-y-7 left-10 w-[680px]"
      >
        <div className="relative h-full">
          <Show show={!fixed} d={!fixed ? 0 : 0} from="fade" className="absolute inset-x-0 top-0">
            <Card className="p-7">
              <div className="flex items-center gap-2.5">
                <Bell className="size-5.5 text-pnc-blue-700" aria-hidden="true" />
                <p className="font-display text-[22px] font-semibold text-pnc-navy">
                  Notifications
                </p>
              </div>
              <ul className="mt-5 space-y-3">
                {reminders.map((r, i) => (
                  <Show key={r.id} show={gaps} d={gaps ? 700 + i * 200 : 0}>
                    <li className="flex gap-4 rounded-2xl bg-white p-5 ring-1 ring-pnc-line">
                      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-pnc-orange/12 text-pnc-orange-600">
                        {r.id === "will" ? (
                          <ScrollText className="size-5" aria-hidden="true" />
                        ) : (
                          <Bell className="size-5" aria-hidden="true" />
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[17px] font-semibold text-pnc-ink">
                          {r.title}
                        </span>
                        <span className="text-[15px] text-pnc-muted">{r.body}</span>
                      </span>
                    </li>
                  </Show>
                ))}
              </ul>
            </Card>
          </Show>
          <Show
            show={fixed}
            from="fade"
            d={fixed ? 300 : 0}
            focus="beneficiaries"
            className="absolute inset-x-0 top-0"
          >
            <Card className="p-7">
              <p className="font-display text-[22px] font-semibold text-pnc-navy">Beneficiaries</p>
              <p className="mt-1 text-[15px] text-pnc-muted">
                Named in each account&apos;s Manage panel. They receive it directly.
              </p>
              <div className="mt-5 space-y-5">
                {named.map((n, ni) => (
                  <div key={n.account}>
                    <p className="text-[16px] font-semibold text-pnc-link">{label(n.account)}</p>
                    <ul className="mt-2 space-y-2">
                      {n.to.map((t, i) => (
                        <Show
                          key={t.person}
                          show={fixed}
                          d={fixed ? 700 + ni * 450 + i * 160 : 0}
                          from="left"
                        >
                          <li className="flex items-center gap-3.5 rounded-xl bg-pnc-surface px-4 py-2.5">
                            <Avatar who={t.person} className="size-10 rounded-full" />
                            <span className="flex-1 text-[17px] font-semibold text-pnc-ink">
                              {storyPeople[t.person].name}
                            </span>
                            <span className="font-display text-[20px] font-semibold text-pnc-navy">
                              {Math.round(t.share * 100)}%
                            </span>
                          </li>
                        </Show>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </Card>
          </Show>
        </div>
      </Show>
      <Show
        show={gaps}
        from="right"
        d={gaps ? 500 : 0}
        focus="john-findoe"
        className="absolute inset-y-7 right-10 w-[600px]"
      >
        <FindoePanel
          className="h-full"
          typed={ask.question}
          typing={on(at, "gaps")}
          sendTap={on(at, "gaps")}
          thinking={on(at, "gaps") || on(at, "named")}
        >
          <Show show={gaps} d={gaps ? 2300 : 0} from="right">
            <Asked>{ask.question}</Asked>
          </Show>
          <div className="relative">
            <Show show={gaps && !fixed} d={gaps && !fixed ? 2900 : 0}>
              <Answer text={findoe.johnBefore.text} sources={findoe.johnBefore.sources} />
            </Show>
            <Show show={fixed} d={fixed ? 2200 : 0} className="absolute inset-x-0 bottom-0">
              <Answer text={findoe.johnAfter.text} sources={findoe.johnAfter.sources} />
            </Show>
          </div>
        </FindoePanel>
      </Show>
    </AppWindow>
  );
}

// ---------------------------------------------------------------------------
// The will.

const pct = (n: number) => `${Math.round(n * 100)}%`;
const names = (list: { person: keyof typeof storyPeople }[]) =>
  list.map((t) => storyPeople[t.person].name).join(" and ");

const clauses = [
  `I appoint my wife, ${willFacts.executor}, as executor of this will.`,
  `I give my ${willFacts.gift.account.name} x${willFacts.gift.account.last4} to my children, ${names(willFacts.gift.to)}, in equal shares.`,
  `I give the rest of my estate to ${willFacts.rest
    .map((r) => `${storyPeople[r.person].name} (${pct(r.share)})`)
    .join(", ")
    .replace(/, ([^,]*)$/, " and $1")}.`,
];

export function WillPlate({ at }: PlateProps) {
  const signed = past(at, "signed");
  const enter = on(at, "will") ? 1100 : 250;
  return (
    <AppWindow
      who="john"
      quiet={past(at, "loss")}
      note={past(at, "loss") ? years : undefined}
      active="Assets and Debts"
      hero={
        <Hero title="Your will" sub="Who inherits what you own, and who carries out your wishes." />
      }
    >
      <div className="absolute inset-x-10 top-7">
        <div className="relative flex justify-between px-6">
          <span className="absolute inset-x-[70px] top-[21px] h-[3px] rounded-full bg-pnc-line" />
          <span
            className="absolute left-[70px] top-[21px] h-[3px] origin-left rounded-full bg-pnc-blue-700 transition-transform duration-[1400ms] ease-out"
            style={{
              width: "calc(100% - 140px)",
              transform: `scaleX(${signed ? 1 : 0})`,
              transitionDelay: signed ? "500ms" : "0ms",
            }}
          />
          {willSteps.map((step, i) => {
            const current = !signed && i === 0;
            return (
              <div key={step} className="relative flex w-[92px] flex-col items-center">
                <span
                  className={cn(
                    "story-ease grid size-[45px] place-items-center rounded-full text-[17px] font-semibold ring-[3px]",
                    signed
                      ? "bg-pnc-blue-700 text-white ring-pnc-blue-700"
                      : current
                        ? "bg-white text-pnc-blue-700 ring-pnc-blue-700"
                        : "bg-white text-pnc-muted ring-pnc-line",
                  )}
                  style={eased(signed ? 500 + i * 170 : 0)}
                >
                  {signed ? <Check className="size-5" aria-hidden="true" /> : i + 1}
                </span>
                <span className="mt-2 whitespace-nowrap text-[14px] text-pnc-muted">{step}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="absolute inset-x-10 bottom-7 top-[140px] flex gap-7">
        <div className="relative w-[560px]">
          <Show show={!signed} d={enter} from="fade" className="absolute inset-0">
            <Card className="h-full p-9">
              <span className="grid size-14 place-items-center rounded-2xl bg-pnc-blue-50 text-pnc-blue-700">
                <ScrollText className="size-7" strokeWidth={1.75} aria-hidden="true" />
              </span>
              <p className="mt-6 font-display text-[32px] font-medium text-pnc-navy">
                Write your will
              </p>
              <p className="mt-3 text-[17px] leading-relaxed text-pnc-muted">
                Decide who inherits what you own, who would raise your children and who carries out
                your wishes.
              </p>
              <p className="mt-5 flex gap-6 text-[15px] text-pnc-muted">
                <span className="flex items-center gap-1.5">
                  <Clock className="size-4" aria-hidden="true" /> About 20 minutes
                </span>
                <span>Free</span>
                <span>Saves as you go</span>
              </p>
              <span className="relative mt-8 inline-flex h-[52px] items-center gap-2 rounded-full bg-pnc-blue-700 px-7 text-[17px] font-semibold text-white">
                Start your will <ArrowRight className="size-4.5" aria-hidden="true" />
                <Tap show={on(at, "will")} d={2000} />
              </span>
            </Card>
          </Show>
          <Show show={signed} d={signed ? 2200 : 0} from="fade" className="absolute inset-0">
            <Card className="h-full p-9">
              <span className="inline-flex items-center gap-2 rounded-full bg-pnc-positive-bg px-4 py-1.5 text-[15px] font-semibold text-pnc-positive">
                <Check className="size-4" aria-hidden="true" /> Your will is on file
              </span>
              <p className="mt-6 font-display text-[32px] font-medium text-pnc-navy">
                Signed, and with PNC
              </p>
              <dl className="mt-6 space-y-4 text-[17px]">
                {[
                  ["Signed", formatDate(willFacts.signedOn, "medium")],
                  ["Executor", willFacts.executor],
                  ["Who knows it is in place", "Maya and your advisor"],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between border-b border-pnc-line pb-3">
                    <dt className="text-pnc-muted">{k}</dt>
                    <dd className="font-semibold text-pnc-ink">{v}</dd>
                  </div>
                ))}
              </dl>
            </Card>
          </Show>
        </div>

        <div className="relative flex-1 overflow-hidden rounded-[4px] bg-white px-14 py-10 font-[Georgia,'Times_New_Roman',serif] text-pnc-ink shadow-[0_30px_60px_-30px_rgb(11_35_64/0.45),0_0_0_1px_rgb(11_35_64/0.05)]">
          <p className="text-center text-[15px] uppercase tracking-[0.32em] text-pnc-muted">
            Last Will and Testament
          </p>
          <p className="mt-2 text-center text-[28px]">of {storyPeople.john.name}</p>
          <div className="relative mt-7">
            <div
              className="story-ease absolute inset-x-0 top-0 space-y-4"
              style={{ opacity: signed ? 0 : 1 }}
            >
              {[92, 100, 78, 96, 64, 88].map((w, i) => (
                <span
                  key={i}
                  className="block h-3 rounded-full bg-pnc-chip"
                  style={{ width: `${w}%` }}
                />
              ))}
            </div>
            <ol className="space-y-4 text-[18px] leading-relaxed">
              {clauses.map((c, i) => (
                <Show key={i} show={signed} d={signed ? 900 + i * 450 : 0} from="fade">
                  <li className="flex gap-3">
                    <span className="text-pnc-muted">{["I.", "II.", "III."][i]}</span>
                    <span>{c}</span>
                  </li>
                </Show>
              ))}
            </ol>
          </div>
          <Show
            show={signed}
            d={signed ? 2500 : 0}
            from="fade"
            className="absolute bottom-9 left-14 right-14 flex items-end justify-between"
          >
            <span>
              <span className="block font-['Brush_Script_MT','Snell_Roundhand',cursive] text-[40px] leading-none text-pnc-navy">
                {storyPeople.john.name}
              </span>
              <span className="mt-2 block border-t border-pnc-ink/40 pt-1.5 text-[14px] text-pnc-muted">
                Signed {formatDate(willFacts.signedOn, "medium")}
              </span>
            </span>
            <span className="-rotate-6 rounded-lg border-[3px] border-pnc-positive/70 px-4 py-2 font-sans text-[15px] font-bold uppercase tracking-[0.18em] text-pnc-positive/80">
              On file · PNC
            </span>
          </Show>
        </div>
      </div>
    </AppWindow>
  );
}
