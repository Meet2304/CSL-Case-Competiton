import { Settings2 } from "lucide-react";
import { MockBadge } from "@/components/mock/Mock";
import { Money } from "@/components/ui/Money";
import {
  accessRows,
  familyIds,
  familyTotals,
  kidsAccounts,
  sharedList,
  sightLabels,
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

const A = storyAccounts;

const roles: Record<string, string> = {
  john: "Admin",
  maya: "Admin",
  david: "Older child",
  alexa: "Younger child",
};

const sightStyle: Record<Sight, string> = {
  hidden: "bg-pnc-chip text-pnc-muted",
  account: "bg-pnc-blue-50 text-pnc-blue-800",
  balance: "bg-pnc-positive-bg text-pnc-positive",
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

/**
 * The shared family dashboard: one list for the whole family, and the
 * admin's control of what each child sees, account by account.
 */
export function SharedPlate({ at }: PlateProps) {
  const panel = during(at, "access", "david");
  const granted = past(at, "granted");
  const phone = past(at, "david");
  const enter = on(at, "dashboard") ? 1100 : 250;
  return (
    <>
      <AppWindow
        who="john"
        active="Family"
        hero={<Hero title="Smith Family" sub="You're an Admin · 4 members" />}
        className="story-ease"
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
              <Card key={k} className="w-[250px] px-6 py-4">
                <p className="text-[14px] text-pnc-muted">{k}</p>
                {v ? (
                  <p className="font-display text-[26px] font-semibold text-pnc-ink">{v}</p>
                ) : (
                  <Money
                    value={familyTotals.value}
                    compact
                    className="font-display text-[26px] font-semibold text-pnc-ink"
                  />
                )}
              </Card>
            ))}
            <MockBadge />
            <span className="relative ml-auto inline-flex h-[50px] items-center gap-2 rounded-full bg-white px-6 text-[16px] font-semibold text-pnc-ink ring-1 ring-pnc-line">
              <Settings2 className="size-4.5" aria-hidden="true" /> Manage family
              <Tap show={on(at, "access")} d={150} />
            </span>
          </div>
          <div className="flex min-h-0 flex-1 gap-5">
            <Card className="flex-1 overflow-hidden">
              <p className="px-7 pb-1 pt-4 font-display text-[19px] font-semibold text-pnc-navy">
                Shared assets and debts
              </p>
              <ul>
                {sharedList.map((id, i) => (
                  <Show key={id} show d={enter + 250 + i * 80}>
                    <li className="flex items-center gap-4 border-b border-pnc-line px-7 py-[5px] last:border-b-0">
                      <span className="min-w-0 flex-1">
                        <span className="text-[16px] font-semibold text-pnc-link">
                          {A[id].name}
                          {A[id].last4 && (
                            <span className="ml-1.5 text-[14px] font-normal text-pnc-muted">
                              x{A[id].last4}
                            </span>
                          )}
                        </span>
                        <span className="block text-[13px] leading-tight text-pnc-muted">
                          Owned by {A[id].owners.map((o) => storyPeople[o].name).join(" & ")}
                          {A[id].external && " · Outside PNC"}
                        </span>
                      </span>
                      <span className="flex -space-x-2">
                        {familyIds.map((p) => {
                          const sees = seenBy(id, granted).includes(p);
                          return (
                            <span
                              key={p}
                              className="story-ease"
                              style={{
                                opacity: sees ? 1 : 0,
                                transform: sees ? "none" : "scale(0.6)",
                                ...eased(sees && granted ? 1500 : 0),
                              }}
                            >
                              <Avatar who={p} className="size-8 rounded-full ring-2 ring-white" />
                            </span>
                          );
                        })}
                      </span>
                      <Money
                        value={A[id].balance}
                        className="w-[170px] text-right font-display text-[18px] font-semibold text-pnc-ink"
                      />
                    </li>
                  </Show>
                ))}
              </ul>
            </Card>
            <Card className="w-[360px] p-6">
              <p className="font-display text-[19px] font-semibold text-pnc-navy">People</p>
              <ul className="mt-3">
                {familyIds.map((p) => (
                  <li key={p} className="flex items-center gap-3.5 border-b border-pnc-line py-3.5">
                    <Avatar who={p} className="size-11 rounded-full" />
                    <span>
                      <span className="block text-[17px] font-semibold text-pnc-ink">
                        {storyPeople[p].name}
                      </span>
                      <span className="text-[14px] text-pnc-muted">{roles[p]}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </Show>

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
          className="absolute bottom-0 right-0 top-0 w-[700px] bg-white px-10 py-7 shadow-[-20px_0_60px_-30px_rgb(11_35_64/0.5)]"
        >
          <p className="font-display text-[26px] font-semibold text-pnc-navy">
            Manage Smith Family
          </p>
          <p className="text-[15px] text-pnc-muted">
            Only admins can see or change these settings.
          </p>
          <div className="mt-5 flex gap-7 border-b border-pnc-line text-[16px]">
            <span className="pb-3 text-pnc-muted">Members</span>
            <span className="border-b-[3px] border-pnc-orange pb-3 font-semibold">
              Roles &amp; access
            </span>
          </div>
          <div className="mt-5 grid grid-cols-[1fr_190px_190px] items-center gap-y-2 text-[16px]">
            <span />
            {(["david", "alexa"] as const).map((p) => (
              <span key={p} className="flex items-center gap-2.5 pb-2">
                <Avatar who={p} className="size-9 rounded-full" />
                <span>
                  <span className="block text-[15px] font-semibold">{storyPeople[p].first}</span>
                  <span className="block text-[13px] text-pnc-muted">{roles[p]}</span>
                </span>
              </span>
            ))}
            {accessRows.map((r, i) => (
              <div key={r.account} className="contents">
                <span className="border-t border-pnc-line py-2.5 font-semibold text-pnc-ink">
                  {A[r.account].name}
                  <span className="ml-1.5 text-[13px] font-normal text-pnc-muted">
                    {A[r.account].last4 ? `x${A[r.account].last4}` : "Outside PNC"}
                  </span>
                </span>
                {(["david", "alexa"] as const).map((p) => {
                  const [before, after] = r[p];
                  const changes = before !== after;
                  const sight = granted ? after : before;
                  const d = 600 + i * 260;
                  return (
                    <span key={p} className="border-t border-pnc-line py-2">
                      <span
                        className={cn(
                          "story-ease relative inline-flex h-[34px] items-center rounded-full px-3.5 text-[14px] font-semibold",
                          sightStyle[sight],
                        )}
                        style={eased(granted && changes ? d + 350 : 0)}
                      >
                        {sightLabels[sight]}
                        {changes && <Tap show={on(at, "granted")} d={d} />}
                      </span>
                    </span>
                  );
                })}
              </div>
            ))}
          </div>
          <p className="mt-4 text-[15px] leading-snug text-pnc-muted">
            Only an account&apos;s owners can move money or change it.
          </p>
        </Show>
      </AppWindow>

      {/* What David sees on his own phone: only what he was given, and nothing about the rest. */}
      <Show
        show={phone}
        from="right"
        d={phone ? 500 : 0}
        className="absolute left-[1130px] top-[70px]"
      >
        <Phone who="david" title="Assets and Debts" className="relative">
          <p className="px-2 text-[13px] font-semibold uppercase tracking-wide text-pnc-muted">
            Yours
          </p>
          <div className="mt-2 rounded-2xl bg-white p-4 shadow-card">
            <p className="text-[16px] font-semibold text-pnc-link">
              {kidsAccounts.david.name}{" "}
              <span className="text-[13px] font-normal text-pnc-muted">
                x{kidsAccounts.david.last4}
              </span>
            </p>
            <Money value={kidsAccounts.david.balance} className="text-[16px] text-pnc-ink" />
          </div>
          <p className="mt-5 px-2 text-[13px] font-semibold uppercase tracking-wide text-pnc-muted">
            Shared with you · Smith Family
          </p>
          <ul className="mt-2 divide-y divide-pnc-line rounded-2xl bg-white shadow-card">
            {accessRows
              .filter((r) => r.david[1] !== "hidden")
              .map((r, i) => (
                <Show key={r.account} show={phone} d={phone ? 1100 + i * 160 : 0}>
                  <li className="flex items-center justify-between px-4 py-3.5">
                    <span className="text-[16px] font-semibold text-pnc-ink">
                      {A[r.account].name}
                    </span>
                    {r.david[1] === "balance" && (
                      <Money value={A[r.account].balance} className="text-[15px] text-pnc-ink" />
                    )}
                  </li>
                </Show>
              ))}
          </ul>
        </Phone>
      </Show>
    </>
  );
}
