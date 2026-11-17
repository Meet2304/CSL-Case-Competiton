import {
  ArrowRight,
  ArrowUp,
  Check,
  ChevronRight,
  HeartHandshake,
  Landmark,
  PiggyBank,
  TrendingUp,
  Umbrella,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { FindoeLogo } from "@/components/brand/FindoeLogo";
import { MockBadge } from "@/components/mock/Mock";
import { Money } from "@/components/ui/Money";
import {
  childrenNote,
  claimDocs,
  condolence,
  kidsAccounts,
  mayaChat,
  storyAccounts,
  storyPeople,
  unclaimed,
  word,
  type StoryAccountId,
} from "@/data/story";
import { cn } from "@/lib/format";
import {
  AppWindow,
  Avatar,
  Card,
  Cite,
  Hero,
  Phone,
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
const icons: Partial<Record<StoryAccountId, LucideIcon>> = {
  joint: Wallet,
  ira: Landmark,
  life: Umbrella,
  brokerage: TrendingUp,
  savings: PiggyBank,
};

// ---------------------------------------------------------------------------
// Maya: met with care, one claim, and a question answered from her own records.

export function MayaPlate({ at }: PlateProps) {
  const claiming = during(at, "claim", "sent");
  const sent = past(at, "sent");
  const chat = past(at, "ask");
  const answered = past(at, "answer");
  const enter = on(at, "condolence") ? 1100 : 250;
  return (
    <AppWindow
      who="maya"
      active="Assets and Debts"
      strip={
        <Show show d={enter + 700} from="fade">
          <div className="flex items-center gap-3.5 border-b border-attention-line bg-attention-bg px-10 py-3.5 text-[16px]">
            <HeartHandshake className="size-6 shrink-0 text-attention" aria-hidden="true" />
            <p className="flex-1">
              <span className="font-semibold text-attention">{condolence.lead}</span>{" "}
              {condolence.body}{" "}
              <span className="font-semibold text-attention">{condolence.link}</span>
            </p>
            <ChevronRight className="size-5 text-attention" aria-hidden="true" />
          </div>
        </Show>
      }
      hero={<Hero title="Assets and Debts" sub="Everything you own and owe, in one place." />}
    >
      <div className="absolute inset-y-6 left-10 w-[820px]">
        <Show show d={enter + 1300} from="fade" className="absolute inset-0">
          <Card className="h-full overflow-hidden">
            <div className="flex gap-7 border-b border-pnc-line px-7 pt-4 text-[16px]">
              <span className="pb-3 text-pnc-muted">Assets</span>
              <span className="pb-3 text-pnc-muted">Debts</span>
              <span className="border-b-[3px] border-pnc-orange pb-3 font-semibold">
                Unclaimed assets
              </span>
            </div>
            <div className="px-7 py-5">
              <div className="flex items-center justify-between">
                <p className="font-display text-[24px] font-medium text-pnc-navy">
                  {unclaimed.title}
                </p>
                <MockBadge />
              </div>
              <div className="mt-3 flex items-center gap-4 rounded-2xl bg-pnc-blue-50 px-5 py-4">
                <div className="relative flex-1 text-[16px]">
                  <p className="text-[13px] font-semibold uppercase tracking-wide text-pnc-blue-800">
                    Today
                  </p>
                  <p
                    className="story-ease absolute mt-0.5"
                    style={{ opacity: sent ? 0 : 1, ...eased(sent ? 0 : 300) }}
                  >
                    {unclaimed.today}
                  </p>
                  <p
                    className="story-ease mt-0.5"
                    style={{ opacity: sent ? 1 : 0, ...eased(sent ? 1100 : 0) }}
                  >
                    Nothing to do today. We&apos;re reviewing what you sent.
                  </p>
                </div>
              </div>
              <ul className="mt-3">
                {unclaimed.rows.map((r, i) => {
                  const Icon = icons[r.account] ?? Wallet;
                  const isJoint = r.account === "joint";
                  return (
                    <Show key={r.account} show d={enter + 1700 + i * 140}>
                      <li className="flex items-center gap-4 border-b border-pnc-line py-3.5">
                        <span className="grid size-11 shrink-0 place-items-center rounded-full bg-pnc-chip text-pnc-blue-700">
                          <Icon className="size-5.5" strokeWidth={1.75} aria-hidden="true" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-[17px] font-semibold text-pnc-ink">
                            {A[r.account].name}
                            {A[r.account].last4 && (
                              <span className="ml-1.5 text-[14px] font-normal text-pnc-muted">
                                x{A[r.account].last4}
                              </span>
                            )}
                          </span>
                          <span className="text-[14px] text-pnc-muted">{r.basis}</span>
                        </span>
                        <Money value={r.amount} className="text-[17px] font-semibold" />
                        <span className="relative w-[130px] text-right">
                          <span
                            className={cn(
                              "story-ease inline-block rounded-full px-3.5 py-1.5 text-[14px] font-semibold",
                              isJoint && sent
                                ? "bg-pnc-orange/12 text-pnc-orange-600"
                                : "bg-pnc-blue-700 text-white",
                            )}
                            style={eased(isJoint && sent ? 900 : 0)}
                          >
                            {isJoint && sent ? "In review" : "Start claim"}
                          </span>
                          {isJoint && <Tap show={on(at, "claim")} d={150} />}
                        </span>
                      </li>
                    </Show>
                  );
                })}
              </ul>
            </div>
          </Card>
        </Show>

        {/* The claim for the joint account: what she already sent is already there. */}
        <Show show={claiming} d={claiming ? 700 : 0} from="scale" className="absolute inset-0">
          <Card className="h-full px-9 py-8 shadow-[0_30px_80px_-30px_rgb(11_35_64/0.6)]">
            <p className="text-[15px] font-semibold text-pnc-link">← All unclaimed assets</p>
            <p className="mt-3 font-display text-[28px] font-medium text-pnc-navy">
              Claim {A.joint.name} x{A.joint.last4}
            </p>
            <p className="text-[16px] text-pnc-muted">
              Owned together, so it is already yours. Three things, and we fill in what we can.
            </p>
            <ol className="mt-6 space-y-3">
              {claimDocs.map((doc, i) => (
                <li
                  key={doc.title}
                  className="flex items-center gap-4 rounded-2xl p-4 ring-1 ring-pnc-line"
                >
                  <span
                    className={cn(
                      "story-ease grid size-10 shrink-0 place-items-center rounded-full text-[15px] font-semibold",
                      claiming ? "bg-pnc-positive text-white" : "bg-pnc-chip text-pnc-muted",
                    )}
                    style={eased(claiming ? 1500 + i * 650 : 0)}
                  >
                    {claiming ? <Check className="size-5" aria-hidden="true" /> : i + 1}
                  </span>
                  <span className="relative flex-1">
                    <span className="block text-[17px] font-semibold text-pnc-ink">
                      {doc.title}
                    </span>
                    <span className="relative block h-[22px] text-[15px]">
                      <span
                        className="story-ease absolute text-pnc-muted"
                        style={{
                          opacity: claiming ? 0 : 1,
                          ...eased(claiming ? 1500 + i * 650 : 0),
                        }}
                      >
                        {doc.ask}
                      </span>
                      <span
                        className="story-ease absolute font-semibold text-pnc-positive"
                        style={{
                          opacity: claiming ? 1 : 0,
                          ...eased(claiming ? 1600 + i * 650 : 0),
                        }}
                      >
                        {doc.filled}
                      </span>
                    </span>
                  </span>
                </li>
              ))}
            </ol>
            <Show show={claiming} d={claiming ? 3600 : 0} className="mt-7">
              <span className="relative inline-flex h-[52px] items-center gap-2 rounded-full bg-pnc-blue-700 px-7 text-[17px] font-semibold text-white">
                Send to PNC <ArrowRight className="size-4.5" aria-hidden="true" />
                <Tap show={claiming} d={4300} />
              </span>
            </Show>
          </Card>
        </Show>
      </div>

      {/* Who she can turn to, and then Findoe answering in her own words. */}
      <div className="absolute inset-y-6 right-10 w-[440px]">
        <Show show={!chat} d={enter + 1500} from="fade" className="absolute inset-x-0 top-0">
          <Card className="p-6">
            <p className="text-[13px] font-semibold uppercase tracking-wide text-pnc-muted">
              Your team
            </p>
            <div className="mt-3 flex items-center gap-4">
              <Avatar who="advisor" className="size-14 rounded-full" />
              <span>
                <span className="block text-[18px] font-semibold">{storyPeople.advisor.name}</span>
                <span className="text-[15px] text-pnc-muted">Here whenever you&apos;re ready</span>
              </span>
            </div>
          </Card>
        </Show>
        <Show
          show={chat}
          from="right"
          d={chat ? 500 : 0}
          focus="maya-findoe"
          className="absolute inset-0"
        >
          <Card className="flex h-full flex-col overflow-hidden shadow-[0_30px_80px_-30px_rgb(11_35_64/0.5)]">
            <div className="flex items-center gap-3 border-b border-pnc-line px-6 py-4">
              <FindoeLogo className="size-9" thinking={on(at, "ask")} />
              <span className="text-[18px] font-semibold">Findoe</span>
            </div>
            {/* Newest at the bottom, like a conversation that has scrolled. */}
            <div className="flex min-h-0 flex-1 flex-col justify-end gap-4 overflow-hidden px-6 py-5 text-[16px] leading-relaxed">
              <Show
                show={chat}
                d={chat ? 2600 : 0}
                from="right"
                className="ml-auto w-fit max-w-[320px] rounded-3xl rounded-br-md bg-pnc-blue-700 px-4 py-2.5 text-white"
              >
                {mayaChat.question}
              </Show>
              <Show show={chat} d={chat ? 3200 : 0} className="space-y-2">
                {mayaChat.steps.map((s, i) => (
                  <Show key={s.label} show={chat} d={chat ? 3300 + i * 600 : 0} from="left">
                    <p className="flex items-start gap-2.5 text-[15px]">
                      <span
                        className={cn(
                          "mt-1.5 size-2 shrink-0 rounded-full",
                          s.kind === "law" ? "bg-law" : "bg-pnc-blue-700",
                        )}
                      />
                      <span>
                        <span className="font-semibold">{s.label}</span>
                        <span className="block text-pnc-muted">{s.detail}</span>
                      </span>
                    </p>
                  </Show>
                ))}
              </Show>
              <Show show={answered} d={answered ? 300 : 0} className="space-y-3">
                <p className="font-semibold">{mayaChat.intro}</p>
                {mayaChat.claims.map((c, i) => (
                  <Show key={c.text} show={answered} d={answered ? 700 + i * 450 : 0} from="left">
                    <p>
                      {c.text} <Cite source={c.source} />
                    </p>
                  </Show>
                ))}
                <Show show={answered} d={answered ? 2200 : 0}>
                  <p className="text-pnc-muted">{mayaChat.close}</p>
                  <span className="mt-3 inline-flex items-center gap-2 rounded-full bg-pnc-blue-50 px-4 py-2 text-[15px] font-semibold text-pnc-blue-800">
                    <Avatar who="advisor" className="size-6 rounded-full" />
                    {mayaChat.action}
                  </span>
                </Show>
              </Show>
            </div>
            <div className="border-t border-pnc-line p-4">
              <div className="flex h-[50px] items-center gap-2 rounded-full bg-pnc-surface pl-5 pr-1.5 text-[15px] ring-1 ring-pnc-line">
                <span
                  className="story-ease min-w-0 flex-1 overflow-hidden"
                  style={{ opacity: past(at, "answer") ? 0 : 1 }}
                >
                  <Typed show={chat} d={900}>
                    {mayaChat.question}
                  </Typed>
                </span>
                <span className="relative grid size-9 place-items-center rounded-full bg-pnc-blue-700 text-white">
                  <ArrowUp className="size-4.5" aria-hidden="true" />
                  <Tap show={on(at, "ask")} d={2100} />
                </span>
              </div>
            </div>
          </Card>
        </Show>
      </div>
    </AppWindow>
  );
}

// ---------------------------------------------------------------------------
// The children: told gently, with nothing asked of them.

export function KidsPlate({ at }: PlateProps) {
  const shown = past(at, "children");
  const enter = on(at, "children") ? 1100 : 250;
  return (
    <>
      {(["david", "alexa"] as const).map((who, i) => {
        const own = kidsAccounts[who];
        return (
          <Show
            key={who}
            show={shown}
            d={enter + i * 350}
            className="absolute top-[90px]"
            style={{ left: 400 + i * 450 }}
          >
            <Phone who={who} title={`Hi, ${storyPeople[who].first}`} className="relative">
              <div className="flex items-start gap-3 rounded-2xl bg-attention-bg p-4 text-[15px] leading-snug ring-1 ring-attention-line">
                <HeartHandshake className="size-5 shrink-0 text-attention" aria-hidden="true" />
                {word.children}
              </div>
              <div className="mt-4 rounded-2xl bg-white p-5 text-center shadow-card">
                <HeartHandshake className="mx-auto size-8 text-attention" aria-hidden="true" />
                <p className="mt-2 font-display text-[20px] font-medium text-pnc-navy">
                  {childrenNote.title}
                </p>
                <p className="mt-1.5 text-[14px] leading-relaxed text-pnc-muted">
                  {childrenNote.body}
                </p>
              </div>
              <p className="mt-5 px-2 text-[13px] font-semibold uppercase tracking-wide text-pnc-muted">
                Your accounts
              </p>
              <div className="mt-2 flex items-center justify-between rounded-2xl bg-white p-4 shadow-card">
                <span className="text-[16px] font-semibold text-pnc-link">
                  {own.name}{" "}
                  <span className="text-[13px] font-normal text-pnc-muted">x{own.last4}</span>
                </span>
                <Money value={own.balance} className="text-[15px]" />
              </div>
            </Phone>
          </Show>
        );
      })}
    </>
  );
}
