import {
  Bell,
  Check,
  ChevronRight,
  Database,
  FileText,
  HeartHandshake,
  MessageCircle,
  Scale,
  Search,
  Send,
} from "lucide-react";
import {
  ChainOfThought,
  ChainOfThoughtResults,
  ChainOfThoughtStep,
} from "@/components/ai-elements/chain-of-thought";
import { MockBadge } from "@/components/mock/Mock";
import { Money } from "@/components/ui/Money";
import {
  advisorFindoe,
  book,
  condolence,
  conversation,
  estateSteps,
  inheritances,
  lossFacts,
  planSteps,
  standing,
  storyAccounts,
  storyPeople,
  willFacts,
} from "@/data/story";
import { cn, formatDate } from "@/lib/format";
import {
  AppWindow,
  Avatar,
  Card,
  FindoePanel,
  Hero,
  Phone,
  Show,
  Tap,
  eased,
  on,
  past,
  type PlateProps,
} from "../parts";

const A = storyAccounts;
const layer = "absolute inset-x-10 inset-y-7";

function Tabs({ active }: { active: "Estate" | "Next steps" | "Client" }) {
  return (
    <div className="flex gap-7 border-b border-pnc-line px-7 pt-4 text-[16px]">
      {(["Estate", "Next steps", "Client"] as const).map((t) => (
        <span
          key={t}
          className={cn(
            "pb-3",
            t === active ? "border-b-[3px] border-pnc-orange font-semibold" : "text-pnc-muted",
          )}
        >
          {t}
        </span>
      ))}
    </div>
  );
}

const clientHero = (
  <Hero title={storyPeople.john.name} sub="Private Bank client since 2010 · Cranberry, PA" />
);

// ---------------------------------------------------------------------------
// The advisor: one alert, one client, and a plan with its reasons.

export function AdvisorPlate({ at }: PlateProps) {
  const client = past(at, "plan");
  const why = past(at, "sources");
  const enter = on(at, "alert") ? 1100 : 250;
  return (
    <AppWindow
      who="advisor"
      active="Home"
      hero={
        <>
          <Hero
            show={!client}
            title="Welcome back"
            sub={`${storyPeople.advisor.role} · PNC Private Bank`}
          />
          <Hero
            show={client}
            title={storyPeople.john.name}
            sub="Private Bank client since 2010 · Cranberry, PA"
          />
        </>
      }
    >
      <Show show={!client} d={enter} from="fade" className={cn(layer, "flex gap-6")}>
        <div className="flex flex-1 flex-col gap-5">
          <div className="flex gap-4">
            <Card className="w-[230px] px-6 py-4">
              <p className="text-[14px] text-pnc-muted">Customers</p>
              <p className="font-display text-[26px] font-semibold">{book.customers}</p>
            </Card>
            <Card className="w-[230px] px-6 py-4 ring-1 ring-attention-line">
              <p className="text-[14px] text-attention">Need attention</p>
              <p className="font-display text-[26px] font-semibold text-attention">
                {book.attention}
              </p>
            </Card>
            <Card className="flex flex-1 items-center gap-3 px-6 text-[16px] text-pnc-muted">
              <Search className="size-5" aria-hidden="true" /> Search clients or family members
            </Card>
          </div>
          <Card className="flex-1 overflow-hidden">
            <div className="flex items-center justify-between px-7 pb-3 pt-5">
              <p className="font-display text-[19px] font-semibold text-pnc-navy">Your Customers</p>
              <MockBadge />
            </div>
            <Show show={!client} d={enter + 500}>
              <div className="relative border-y border-attention-line bg-attention-bg px-7 py-4">
                <div className="flex items-center gap-4">
                  <span className="grid size-10 place-items-center rounded-full bg-white text-attention ring-1 ring-attention-line">
                    <HeartHandshake className="size-5" aria-hidden="true" />
                  </span>
                  <span className="flex-1">
                    <span className="block text-[18px] font-semibold text-pnc-link">
                      {storyPeople.john.name}
                    </span>
                    <span className="mt-0.5 inline-block rounded-full bg-white px-2.5 py-0.5 text-[13px] font-semibold text-attention ring-1 ring-attention-line">
                      Customer passed away · {formatDate(lossFacts.died, "monthDay")}
                    </span>
                  </span>
                  <Money
                    value={book.john.relationshipValue}
                    compact
                    className="w-[110px] text-[17px] font-semibold"
                  />
                  <span className="flex w-[170px] items-center gap-1.5 text-[15px] font-semibold text-pnc-positive">
                    <FileText className="size-4" aria-hidden="true" /> Will on file
                  </span>
                </div>
                <div className="ml-14 mt-3 flex gap-2.5">
                  {book.nextActions.map((n) => (
                    <span
                      key={n}
                      className="rounded-full bg-white px-3.5 py-1 text-[14px] font-semibold text-pnc-link ring-1 ring-pnc-line"
                    >
                      {n}
                    </span>
                  ))}
                </div>
                <Tap show={on(at, "plan")} d={100} />
              </div>
            </Show>
            {book.others.map((c) => (
              <div
                key={c.id}
                className="flex items-center gap-4 border-b border-pnc-line px-7 py-3.5 text-[16px] text-pnc-muted last:border-b-0"
              >
                <span className="size-10" />
                <span className="flex-1 font-semibold text-pnc-link/70">{c.name}</span>
                <Money value={c.relationshipValue} compact className="w-[110px]" />
                <span className="w-[170px]">
                  {c.will?.status === "on-file" ? "Will on file" : "No will"}
                </span>
              </div>
            ))}
          </Card>
        </div>
        <Card className="h-fit w-[380px] p-6">
          <div className="flex items-center gap-2.5">
            <Bell className="size-5 text-pnc-blue-700" aria-hidden="true" />
            <p className="font-display text-[19px] font-semibold text-pnc-navy">Notifications</p>
            <span className="ml-auto rounded-full bg-attention-bg px-2.5 py-0.5 text-[13px] font-semibold text-attention">
              1 urgent
            </span>
          </div>
          <Show show={!client} d={enter + 900} from="right">
            <div className="mt-5 rounded-2xl bg-attention-bg p-4 ring-1 ring-attention-line">
              <p className="text-[16px] font-semibold text-attention">Customer passed away</p>
              <p className="text-[15px] text-pnc-ink">{storyPeople.john.name} · yesterday</p>
            </div>
          </Show>
          <div className="mt-3 space-y-3 opacity-60">
            {["Annual review coming up", "Large deposit received", "Documents signed"].map((n) => (
              <div key={n} className="rounded-2xl p-4 ring-1 ring-pnc-line">
                <p className="text-[15px] font-semibold text-pnc-ink">{n}</p>
              </div>
            ))}
          </div>
        </Card>
      </Show>

      <Show show={client} d={client ? 350 : 0} from="fade" className={cn(layer, "flex gap-6")}>
        <Card className="flex-1 overflow-hidden">
          <Tabs active="Next steps" />
          <div className="px-8 py-4">
            <div className="flex items-center justify-between">
              <p className="text-[14px] text-pnc-muted">Where things stand</p>
              <MockBadge />
            </div>
            <p className="mt-1 font-display text-[28px] font-medium text-pnc-navy">
              {standing.headline}
            </p>
            <p className="mt-1 max-w-[760px] text-[16px] leading-snug text-pnc-muted">
              {standing.body}
            </p>
            <div className="mt-3 flex gap-12">
              <div>
                <p className="text-[14px] text-pnc-muted">Passes directly</p>
                <Money
                  value={standing.direct}
                  compact
                  className="font-display text-[26px] font-semibold text-pnc-positive"
                />
              </div>
              <div>
                <p className="text-[14px] text-pnc-muted">Goes through probate</p>
                <Money
                  value={standing.probate}
                  className="font-display text-[26px] font-semibold text-pnc-ink"
                />
              </div>
            </div>
            <p className="mt-4 font-display text-[19px] font-semibold text-pnc-navy">Do next</p>
            <ol className="mt-2">
              {planSteps.map((s, i) => (
                <Show key={s.title} show={client} d={client ? 900 + i * 220 : 0} from="left">
                  <li className="flex gap-4 border-b border-pnc-line py-2 last:border-b-0">
                    <span className="w-5 pt-0.5 text-[16px] text-pnc-muted">{i + 1}</span>
                    <span className="flex-1">
                      <span className="block text-[17px] font-semibold text-pnc-ink">
                        {s.title}
                      </span>
                      <span className="text-[14px] text-pnc-muted">{s.detail}</span>
                    </span>
                    <span
                      className={cn(
                        "h-fit rounded-full px-3 py-0.5 text-[13px] font-semibold",
                        s.when === "Today"
                          ? "bg-attention-bg text-attention"
                          : "bg-pnc-chip text-pnc-muted",
                      )}
                    >
                      {s.when} · {s.who}
                    </span>
                  </li>
                </Show>
              ))}
            </ol>
          </div>
        </Card>

        {/* Findoe, docked beside the plan: what it worked through, cited, and what it needs. */}
        <FindoePanel
          focus="findoe-dock"
          className="w-[540px]"
          records="client records"
          thinking={on(at, "plan")}
        >
          <Show show={client} d={client ? 1200 : 0}>
            <div className="flex gap-3">
              <span className="w-6 shrink-0" />
              <div className="min-w-0 flex-1 text-[15px] leading-relaxed">
                <p>{advisorFindoe.opening}</p>
                <div className="mt-2.5">
                  <ChainOfThought
                    running={false}
                    title="Working on it"
                    doneTitle={`Worked through ${advisorFindoe.steps.length} steps`}
                    defaultOpen
                    stayOpen
                  >
                    {advisorFindoe.steps.map((s, i) => (
                      <Show key={s.label} show={why} d={why ? 600 + i * 450 : 0} from="left">
                        <ChainOfThoughtStep
                          icon={s.kind === "law" ? Scale : Database}
                          label={s.label}
                          status="done"
                        >
                          <ChainOfThoughtResults items={s.results} />
                        </ChainOfThoughtStep>
                      </Show>
                    ))}
                  </ChainOfThought>
                </div>
              </div>
            </div>
          </Show>
          <Show
            show={why}
            d={why ? 2400 : 0}
            className="rounded-2xl bg-pnc-blue-50 p-4 ring-1 ring-pnc-blue-600/20"
          >
            <p className="text-[13px] font-semibold uppercase tracking-wide text-pnc-blue-800">
              One thing I need from you
            </p>
            <p className="mt-1 text-[15px] font-semibold text-pnc-ink">{advisorFindoe.need}</p>
            <div className="mt-3 flex gap-2">
              {advisorFindoe.answers.map((a) => (
                <span
                  key={a}
                  className="rounded-full bg-white px-4 py-1.5 text-[14px] font-semibold ring-1 ring-pnc-line"
                >
                  {a}
                </span>
              ))}
            </div>
          </Show>
        </FindoePanel>
      </Show>
    </AppWindow>
  );
}

// ---------------------------------------------------------------------------
// The estate: a condolence first, then the will carried out, and Maya told.

export function EstatePlate({ at }: PlateProps) {
  const talking = past(at, "message") && !past(at, "transfer");
  const consoled = past(at, "message");
  const started = past(at, "transfer");
  const enter = on(at, "estate") ? 1100 : 250;
  const doneSteps = [true, consoled, started, started];
  return (
    <>
      <AppWindow
        who="advisor"
        active={talking ? "Messages" : "Home"}
        hero={clientHero}
        // Makes room for Maya's phone beside it once the transfer starts.
        left={started ? 40 : 100}
        width={started ? 1090 : 1400}
        className="transition-[left,width] duration-[1100ms] ease-[cubic-bezier(0.6,0,0.2,1)]"
      >
        <Show show d={enter} from="fade" className={layer}>
          <Card className="h-full overflow-hidden">
            <Tabs active="Estate" />
            <div className="px-8 py-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-display text-[26px] font-medium text-pnc-navy">
                    Estate of {storyPeople.john.name}
                  </p>
                  <p className="text-[15px] text-pnc-muted">
                    Passed away {formatDate(lossFacts.died, "medium")} · Will on file, signed{" "}
                    {formatDate(willFacts.signedOn, "medium")} · Executor {willFacts.executor}
                  </p>
                </div>
                <span
                  className={cn(
                    "story-ease rounded-full px-3.5 py-1 text-[14px] font-semibold",
                    started
                      ? "bg-pnc-positive-bg text-pnc-positive"
                      : "bg-attention-bg text-attention",
                  )}
                  style={eased(started ? 900 : 0)}
                >
                  {started ? "Transfer started" : "Transfer not started"}
                </span>
              </div>

              <ol className="mt-4 grid grid-cols-4 gap-3">
                {estateSteps.map((s, i) => {
                  const done = doneSteps[i];
                  return (
                    <li
                      key={s.title}
                      className={cn(
                        "story-ease relative rounded-2xl px-4 py-3 ring-1",
                        done ? "bg-pnc-positive-bg ring-transparent" : "bg-white ring-pnc-line",
                      )}
                      style={eased(done ? 700 + Math.max(0, i - 2) * 300 : 0)}
                    >
                      <span
                        className={cn(
                          "story-ease grid size-8 place-items-center rounded-full text-[15px] font-semibold",
                          done ? "bg-pnc-positive text-white" : "bg-pnc-chip text-pnc-muted",
                        )}
                        style={eased(done ? 700 + Math.max(0, i - 2) * 300 : 0)}
                      >
                        {done ? <Check className="size-4" aria-hidden="true" /> : i + 1}
                      </span>
                      <p className="mt-2 text-[16px] font-semibold leading-snug text-pnc-ink">
                        {s.title}
                      </p>
                      <p className="text-[14px] leading-snug text-pnc-muted">{s.detail}</p>
                      {i === 1 && <Tap show={on(at, "message")} d={300} />}
                      {i === 2 && <Tap show={on(at, "transfer")} d={200} />}
                    </li>
                  );
                })}
              </ol>

              <div className="mt-4 flex items-center gap-3">
                <p className="font-display text-[19px] font-semibold text-pnc-navy">
                  Beneficiaries and what passes to them
                </p>
                <MockBadge />
              </div>
              <div className="mt-3 grid grid-cols-3 gap-4">
                {inheritances.map((b, bi) => (
                  <Show key={b.person} show d={enter + 300 + bi * 150}>
                    <div
                      className={cn(
                        "story-ease rounded-2xl bg-white px-5 py-4 ring-1",
                        started ? "ring-pnc-positive/50" : "ring-pnc-line",
                      )}
                      style={eased(started ? 1300 + bi * 350 : 0)}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar who={b.person} className="size-11 rounded-full" />
                        <span className="flex-1">
                          <span className="block text-[17px] font-semibold">
                            {storyPeople[b.person].name}
                          </span>
                          <span className="text-[14px] text-pnc-muted">{b.note}</span>
                        </span>
                        <span
                          className="story-ease flex items-center gap-1 rounded-full bg-pnc-positive px-2.5 py-0.5 text-[13px] font-semibold text-white"
                          style={{
                            opacity: started ? 1 : 0,
                            transform: started ? "none" : "scale(0.7)",
                            ...eased(started ? 1300 + bi * 350 : 0),
                          }}
                        >
                          <Send className="size-3" aria-hidden="true" /> Notified
                        </span>
                      </div>
                      <Money
                        value={b.total}
                        className="mt-2 block font-display text-[24px] font-semibold text-pnc-navy"
                      />
                      {/* Once everyone is told, the detail folds away and who was told stays. */}
                      <div
                        className="grid transition-[grid-template-rows,opacity] duration-700"
                        style={{
                          gridTemplateRows: started ? "0fr" : "1fr",
                          opacity: started ? 0 : 1,
                          transitionDelay: started ? "600ms" : "0ms",
                        }}
                      >
                        <ul className="mt-2 min-h-0 space-y-1.5 overflow-hidden">
                          {b.items.map((it) => (
                            <li key={it.account} className="flex justify-between gap-3 text-[14px]">
                              <span className="text-pnc-muted">
                                <span className="font-semibold text-pnc-ink">
                                  {A[it.account].name}
                                </span>{" "}
                                · {it.basis}
                              </span>
                              <Money value={it.amount} compact className="shrink-0 text-pnc-ink" />
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </Show>
                ))}
              </div>
            </div>
          </Card>
        </Show>

        {/* A note to Maya, before any of it. */}
        <div
          aria-hidden="true"
          className="story-ease pointer-events-none absolute inset-0 bg-pnc-navy/25"
          style={{ opacity: talking ? 1 : 0 }}
        />
        <Show
          show={talking}
          from="right"
          d={talking ? 500 : 0}
          focus="messages"
          className="absolute bottom-0 right-0 top-0 w-[620px] bg-white shadow-[-20px_0_60px_-30px_rgb(11_35_64/0.5)]"
        >
          <div className="flex items-center gap-3.5 border-b border-pnc-line px-8 py-5">
            <Avatar who="maya" className="size-12 rounded-full" />
            <span>
              <span className="block text-[19px] font-semibold">{storyPeople.maya.name}</span>
              <span className="text-[14px] text-pnc-muted">John&apos;s spouse · executor</span>
            </span>
            <MessageCircle className="ml-auto size-5 text-pnc-muted" aria-hidden="true" />
          </div>
          <div className="space-y-4 px-8 py-7">
            {conversation.map((m, i) => {
              const mine = m.from === "advisor";
              return (
                <Show
                  key={i}
                  show={talking}
                  d={talking ? 1300 + i * 1500 : 0}
                  from={mine ? "right" : "left"}
                  className={cn("flex", mine ? "justify-end" : "justify-start")}
                >
                  <p
                    className={cn(
                      "max-w-[440px] rounded-3xl px-5 py-3.5 text-[17px] leading-relaxed",
                      mine
                        ? "rounded-br-md bg-pnc-blue-700 text-white"
                        : "rounded-bl-md bg-pnc-surface text-pnc-ink",
                    )}
                  >
                    {m.text}
                  </p>
                </Show>
              );
            })}
          </div>
        </Show>
      </AppWindow>

      {/* The moment the transfer starts, Maya's phone: a condolence first. */}
      <Show
        show={started}
        from="right"
        d={started ? 1500 : 0}
        className="absolute left-[1190px] top-[110px]"
      >
        <Phone who="maya" title="Home" className="relative" style={{ position: "relative" }}>
          <div className="flex items-start gap-3 rounded-2xl bg-attention-bg p-4 text-[15px] leading-snug ring-1 ring-attention-line">
            <HeartHandshake className="size-5 shrink-0 text-attention" aria-hidden="true" />
            <span>
              <span className="font-semibold text-attention">{condolence.lead}</span>{" "}
              {condolence.body}
              <span className="mt-2 flex items-center gap-1 font-semibold text-attention">
                {condolence.link} <ChevronRight className="size-4" aria-hidden="true" />
              </span>
            </span>
          </div>
          <div className="mt-4 rounded-2xl bg-white p-4 shadow-card">
            <p className="text-[13px] font-semibold uppercase tracking-wide text-pnc-muted">
              Your team
            </p>
            <div className="mt-2 flex items-center gap-3">
              <Avatar who="advisor" className="size-10 rounded-full" />
              <span className="text-[15px] font-semibold">{storyPeople.advisor.name}</span>
            </div>
          </div>
        </Phone>
      </Show>
    </>
  );
}
