import { ArrowLeft, Settings2 } from "lucide-react";
import { MockBadge } from "@/components/mock/Mock";
import { Money } from "@/components/ui/Money";
import {
  accessRows,
  familyIds,
  familyTotals,
  kidsAccounts,
  sharedList,
  storyAccounts,
  storyPeople,
  type Sight,
  type StoryAccountId,
  type StoryPersonId,
} from "@/data/story";
import { cn } from "@/lib/format";
import {
  AppWindow,
  Avatar,
  Card,
  Hero,
  Phone,
  Show,
  Tap,
  during,
  eased,
  on,
  past,
  type PlateProps,
} from "../parts";
import { years as johnYears } from "./before";

const A = storyAccounts;

const roles: Record<string, string> = {
  john: "Admin",
  maya: "Admin",
  david: "Older child",
  alexa: "Younger child",
};

/** Who can see an account on the family dashboard, once John has shared what he chose. */
function seenBy(id: StoryAccountId, granted: boolean): StoryPersonId[] {
  const row = accessRows.find((r) => r.account === id);
  const parents: StoryPersonId[] = ["john", "maya"];
  if (!row) return parents;
  return [
    ...parents,
    ...(row.david[granted ? 1 : 0] !== "hidden" ? (["david"] as const) : []),
    ...(row.alexa[granted ? 1 : 0] !== "hidden" ? (["alexa"] as const) : []),
  ];
}

/** When John's choice for a row lands, in ms after the press. */
const landsAt = (i: number) => 700 + i * 380;

/** One round radio button, as in the app's access matrix. */
function Radio({ picked, d }: { picked: boolean; d: number }) {
  return (
    <span
      className={cn(
        "story-ease inline-grid size-[22px] place-items-center rounded-full ring-2",
        picked ? "ring-pnc-blue-700" : "ring-pnc-line",
      )}
      style={eased(d)}
    >
      <span
        className="story-ease size-[11px] rounded-full bg-pnc-blue-700"
        style={{ transform: picked ? "scale(1)" : "scale(0)", ...eased(d) }}
      />
    </span>
  );
}

/**
 * The shared family dashboard, with David's own phone beside it: John
 * decides, account by account, what David's role can see, and David's
 * screen changes as he does.
 */
export function SharedPlate({ at }: PlateProps) {
  const panel = during(at, "access", "david");
  const granted = past(at, "granted");
  const enter = on(at, "dashboard") ? 1100 : 250;
  const sight = (r: (typeof accessRows)[number]): Sight => r.david[granted ? 1 : 0];

  return (
    <>
      <AppWindow
        who="john"
        quiet={past(at, "loss")}
        note={past(at, "loss") ? johnYears : undefined}
        active="Family"
        hero={<Hero title="Smith Family" sub="You're an Admin · 4 members" />}
        left={40}
        width={1090}
      >
        <Show
          show
          d={enter}
          from="fade"
          className="absolute inset-x-10 inset-y-7 flex flex-col gap-5"
        >
          <div className="flex items-center gap-4">
            {(
              [
                ["Accounts shared", String(familyTotals.shared)],
                ["Total value", null],
                ["Members", String(familyTotals.members)],
              ] as const
            ).map(([k, v]) => (
              <Card key={k} className="w-[190px] px-5 py-3.5">
                <p className="text-[14px] text-pnc-muted">{k}</p>
                {v ? (
                  <p className="font-display text-[24px] font-semibold text-pnc-ink">{v}</p>
                ) : (
                  <Money
                    value={familyTotals.value}
                    compact
                    className="font-display text-[24px] font-semibold text-pnc-ink"
                  />
                )}
              </Card>
            ))}
            <span className="relative ml-auto inline-flex h-[48px] items-center gap-2 rounded-full bg-white px-5 text-[15px] font-semibold text-pnc-ink ring-1 ring-pnc-line">
              <Settings2 className="size-4.5" aria-hidden="true" /> Manage family
              <Tap show={on(at, "access")} d={150} />
            </span>
          </div>
          <div className="flex min-h-0 flex-1 gap-5">
            <Card className="flex-1 overflow-hidden">
              <div className="flex items-center justify-between px-6 pb-1 pt-4">
                <p className="font-display text-[19px] font-semibold text-pnc-navy">
                  Shared assets and debts
                </p>
                <MockBadge />
              </div>
              <ul>
                {sharedList.map((id, i) => (
                  <Show key={id} show d={enter + 250 + i * 80}>
                    <li className="flex items-center gap-3 border-b border-pnc-line px-6 py-[5px] last:border-b-0">
                      <span className="min-w-0 flex-1">
                        <span className="text-[16px] font-semibold text-pnc-link">
                          {A[id].name}
                          {A[id].last4 && (
                            <span className="ml-1.5 text-[13px] font-normal text-pnc-muted">
                              x{A[id].last4}
                            </span>
                          )}
                        </span>
                        <span className="block text-[13px] leading-tight text-pnc-muted">
                          {A[id].owners.map((o) => storyPeople[o].first).join(" & ")}
                          {A[id].external && " · Outside PNC"}
                        </span>
                      </span>
                      <span className="flex -space-x-2">
                        {familyIds.map((p) => {
                          const sees = seenBy(id, granted).includes(p);
                          const row = accessRows.findIndex((r) => r.account === id);
                          return (
                            <span
                              key={p}
                              className="story-ease"
                              style={{
                                opacity: sees ? 1 : 0,
                                transform: sees ? "none" : "scale(0.6)",
                                ...eased(sees && granted ? landsAt(row) + 300 : 0),
                              }}
                            >
                              <Avatar who={p} className="size-7 rounded-full ring-2 ring-white" />
                            </span>
                          );
                        })}
                      </span>
                      <Money
                        value={A[id].balance}
                        compact
                        className="w-[84px] text-right font-display text-[17px] font-semibold text-pnc-ink"
                      />
                    </li>
                  </Show>
                ))}
              </ul>
            </Card>
            <Card className="w-[250px] p-5">
              <p className="font-display text-[19px] font-semibold text-pnc-navy">People</p>
              <ul className="mt-2">
                {familyIds.map((p) => (
                  <li
                    key={p}
                    className="flex items-center gap-3 border-b border-pnc-line py-3 last:border-b-0"
                  >
                    <Avatar who={p} className="size-10 rounded-full" />
                    <span>
                      <span className="block text-[16px] font-semibold text-pnc-ink">
                        {storyPeople[p].first}
                      </span>
                      <span className="text-[13px] text-pnc-muted">{roles[p]}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </Show>

        {/* Manage family › Roles & access › Older child: the app's own access matrix. */}
        <div
          aria-hidden="true"
          className="story-ease pointer-events-none absolute inset-0 bg-pnc-navy/25"
          style={{ opacity: panel ? 1 : 0 }}
        />
        <Show
          show={panel}
          from="right"
          d={panel ? 400 : 0}
          focus="access-panel"
          className="absolute bottom-0 right-0 top-0 w-[640px] bg-white px-9 py-6 shadow-[-20px_0_60px_-30px_rgb(11_35_64/0.5)]"
        >
          <p className="font-display text-[24px] font-semibold text-pnc-navy">
            Manage Smith Family
          </p>
          <div className="mt-3 flex gap-7 border-b border-pnc-line text-[15px]">
            <span className="pb-2.5 text-pnc-muted">Members</span>
            <span className="border-b-[3px] border-pnc-orange pb-2.5 font-semibold">
              Roles &amp; access
            </span>
          </div>
          <p className="mt-4 flex items-center gap-1.5 text-[14px] font-semibold text-pnc-link">
            <ArrowLeft className="size-4" aria-hidden="true" /> All roles
          </p>
          <p className="mt-2 flex items-center gap-3 text-[21px] font-semibold text-pnc-ink">
            Edit role · Older child
            <span className="flex items-center gap-2 text-[14px] font-normal text-pnc-muted">
              <Avatar who="david" className="size-7 rounded-full" /> David
            </span>
          </p>
          <p className="mt-4 text-[16px] font-semibold text-pnc-ink">What this role can see</p>
          <p className="text-[14px] text-pnc-muted">
            Only an account&apos;s owners can move money or change it.
          </p>
          <table className="mt-3 w-full table-fixed text-[15px]">
            <colgroup>
              <col />
              <col className="w-[110px]" />
              <col className="w-[150px]" />
            </colgroup>
            <thead>
              <tr className="border-b border-pnc-line bg-pnc-surface text-left">
                <th className="rounded-tl-md px-3 py-2 font-semibold">Shared assets</th>
                <th className="border-l border-pnc-line px-2 py-2 text-center text-[13px] font-semibold text-pnc-muted">
                  Account
                </th>
                <th className="rounded-tr-md border-l border-pnc-line px-2 py-2 text-center text-[13px] font-semibold text-pnc-muted">
                  Account and balances
                </th>
              </tr>
            </thead>
            <tbody>
              {accessRows.map((r, i) => {
                const now = sight(r);
                const changes = r.david[0] !== r.david[1];
                const d = granted && changes ? landsAt(i) : 0;
                return (
                  <tr key={r.account} className="border-b border-pnc-line last:border-b-0">
                    <th className="truncate px-3 py-[9px] text-left font-normal text-pnc-ink">
                      {A[r.account].name}
                      {A[r.account].last4 && (
                        <span className="text-pnc-muted"> x{A[r.account].last4}</span>
                      )}
                    </th>
                    {(["account", "balance"] as const).map((level) => (
                      <td
                        key={level}
                        className="relative border-l border-pnc-line px-2 py-[9px] text-center"
                      >
                        <Radio picked={now === level} d={d} />
                        {changes && r.david[1] === level && (
                          <Tap show={on(at, "granted")} d={landsAt(i) - 350} />
                        )}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Show>
      </AppWindow>

      {/* David's own phone: only what he was given, and nothing about the rest. */}
      <Phone
        who="david"
        title="Assets and Debts"
        focus="david-phone"
        className="left-[1190px] top-[110px]"
      >
        <p className="px-1 text-[13px] font-semibold uppercase tracking-wide text-pnc-muted">
          Yours
        </p>
        <div className="mt-2 flex items-center justify-between rounded-2xl bg-white p-4 shadow-card">
          <span className="text-[16px] font-semibold text-pnc-link">
            {kidsAccounts.david.name}{" "}
            <span className="text-[13px] font-normal text-pnc-muted">
              x{kidsAccounts.david.last4}
            </span>
          </span>
          <Money value={kidsAccounts.david.balance} className="text-[15px] text-pnc-ink" />
        </div>
        <p className="mt-5 px-1 text-[13px] font-semibold uppercase tracking-wide text-pnc-muted">
          Shared with you · Smith Family
        </p>
        <ul className="mt-2 overflow-hidden rounded-2xl bg-white shadow-card">
          {accessRows.map((r, i) => {
            const now = sight(r);
            const shown = now !== "hidden";
            const fresh = granted && r.david[0] === "hidden";
            return (
              <li
                key={r.account}
                className="story-ease grid overflow-hidden"
                style={{
                  gridTemplateRows: shown ? "1fr" : "0fr",
                  opacity: shown ? 1 : 0,
                  ...eased(fresh ? landsAt(i) + 250 : 0),
                }}
              >
                <span className="min-h-0 overflow-hidden">
                  <span className="flex items-center justify-between border-b border-pnc-line px-4 py-3.5">
                    <span className="text-[16px] font-semibold text-pnc-ink">
                      {A[r.account].name}
                    </span>
                    {now === "balance" && (
                      <Money value={A[r.account].balance} className="text-[15px] text-pnc-ink" />
                    )}
                  </span>
                </span>
              </li>
            );
          })}
        </ul>
      </Phone>
    </>
  );
}
