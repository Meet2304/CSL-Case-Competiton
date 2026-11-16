"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  BadgeCheck,
  CircleCheck,
  FileCheck2,
  MessageSquare,
  ScrollText,
  Send,
  UserRound,
} from "lucide-react";
import {
  beneficiaryDetail,
  estateClient,
  transferNotices,
} from "@/components/advisor/messages/contacts";
import { MockBadge } from "@/components/mock/Mock";
import { Dialog } from "@/components/ui/Dialog";
import { Money } from "@/components/ui/Money";
import { PersonAvatar } from "@/components/ui/PersonAvatar";
import { buttonClass } from "@/components/will/ui";
import { beneficiaryAdvisors, custodianFor, deathCertificates, willsOnFile } from "@/data/estate";
import { MOCK_AS_OF } from "@/data/mock";
import type { AdvisorCustomer } from "@/data/types";
import { openLoss } from "@/lib/advisor";
import { bereavementActions, currentBereavement, useBereavement } from "@/lib/bereavement";
import { beneficiarySteps, routeLabels, transferPlan, type BeneficiaryShare } from "@/lib/estate";
import { cn, formatDate } from "@/lib/format";
import { ageOn, currentAccounts, personById } from "@/lib/household";
import { useHousehold } from "@/lib/householdStore";
import { messagesActions, threadOf, useMessages } from "@/lib/messages";
import { routes } from "@/lib/routes";

/** Whether this client's estate is in the demo: they've died and their will is on file. */
export function hasEstate(customer: AdvisorCustomer): boolean {
  return (
    customer.id === estateClient.customerId &&
    openLoss(customer)?.relationship === "Self" &&
    Boolean(willsOnFile[estateClient.personId])
  );
}

const when = (iso: string) =>
  new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

/** Adult beneficiaries the advisor writes to (a minor is reached through their custodian). */
const reachable = (personId: string) => custodianFor[personId] ?? personId;

/**
 * Where processing the will stands, derived from what has happened: the
 * certificate opened, a condolence message sent, the transfer started (which
 * also briefs the beneficiaries' advisors).
 */
function useEstateProgress(personId: string) {
  const b = useBereavement();
  const m = useMessages();
  const beneficiaries = Object.keys(beneficiaryAdvisors);
  return {
    certificate: b.certificateReviewed?.[personId],
    condolences: beneficiaries.some((id) =>
      threadOf(m, id).some((x) => x.from === "advisor" && !x.notice),
    ),
    transfer: b.transfers?.[personId]?.initiatedOn,
  };
}

/** The death certificate, in a dialog. Opening it counts as reviewing it. */
export function DeathCertificateDialog({
  open,
  onClose,
  date,
}: {
  open: boolean;
  onClose: () => void;
  date: string;
}) {
  const { personId } = estateClient;
  const c = deathCertificates[personId];
  useEffect(() => {
    if (open) bereavementActions.reviewCertificate(personId, new Date().toISOString());
  }, [open, personId]);
  const rows: [string, string][] = [
    ["Name of deceased", c.decedent],
    ["Date of death", formatDate(date, "long")],
    ["Place of death", c.placeOfDeath],
    ["Manner of death", c.mannerOfDeath],
    ["Certified by", c.certifiedBy],
  ];
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Death certificate"
      description={`Certificate ${c.certificateNumber}`}
    >
      <div className="px-5 py-5">
        <div className="rounded-md border-2 border-double border-pnc-line bg-pnc-surface/60 px-5 py-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-[Georgia,serif] text-lg text-pnc-ink">Certificate of Death</p>
              <p className="text-xs text-pnc-muted">{c.issuedBy}</p>
            </div>
            <MockBadge />
          </div>
          <dl className="mt-4 space-y-2 text-sm">
            {rows.map(([k, v]) => (
              <div
                key={k}
                className="grid grid-cols-[9rem_1fr] gap-3 border-b border-pnc-line pb-2"
              >
                <dt className="text-pnc-muted">{k}</dt>
                <dd className="font-semibold text-pnc-ink">{v}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-3 text-xs text-pnc-muted">No. {c.certificateNumber}</p>
        </div>
        <p className="mt-4 flex items-start gap-2 text-sm text-pnc-ink">
          <BadgeCheck className="mt-0.5 size-4 shrink-0 text-pnc-positive" aria-hidden="true" />
          <span>
            Sent by {personById(c.receivedFrom.personId)?.name} ({c.receivedFrom.via.toLowerCase()})
            and verified by {c.verifiedBy}.
          </span>
        </p>
      </div>
    </Dialog>
  );
}

const chip =
  "inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-pnc-link ring-1 ring-pnc-line hover:ring-pnc-link focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pnc-link";

/**
 * The next actions on a deceased client's row in the advisor's book: review
 * the certificate (in place), process the will, and message the family.
 */
export function EstateActions({ customer }: { customer: AdvisorCustomer }) {
  const [viewing, setViewing] = useState(false);
  const loss = openLoss(customer)!;
  const progress = useEstateProgress(estateClient.personId);
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
      <p className="text-xs font-semibold text-pnc-ink">Next actions</p>
      <div className="flex flex-wrap gap-1.5">
        <button type="button" onClick={() => setViewing(true)} className={chip}>
          {progress.certificate && <CircleCheck className="size-3.5" aria-hidden="true" />}
          Review death certificate
        </button>
        <Link href={routes.advisorEstate(customer.id)} className={chip}>
          {progress.transfer && <CircleCheck className="size-3.5" aria-hidden="true" />}
          Process will
        </Link>
        <Link href={routes.advisorMessage(reachable("p-casey"))} className={chip}>
          {progress.condolences && <CircleCheck className="size-3.5" aria-hidden="true" />}
          Message beneficiaries
        </Link>
      </div>
      <DeathCertificateDialog open={viewing} onClose={() => setViewing(false)} date={loss.date} />
    </div>
  );
}

/**
 * A deceased client's estate, for their advisor: the steps to process the
 * will, the will itself, how every account passes (and who carries the
 * debts), and a way to reach each beneficiary and their own advisor. The
 * beneficiaries aren't this advisor's clients: the advisor can message them
 * and see that they were told, but not manage what they receive.
 */
export function EstatePanel({ customer }: { customer: AdvisorCustomer }) {
  const { personId } = estateClient;
  const john = personById(personId)!;
  const loss = openLoss(customer)!;
  const will = willsOnFile[personId];
  const household = useHousehold();
  const progress = useEstateProgress(personId);
  const plan = useMemo(
    () => transferPlan(currentAccounts(household), personId, will),
    [household, personId, will],
  );
  const [viewing, setViewing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const executor = personById(will.executor)?.name;
  const sender = personById(deathCertificates[personId].receivedFrom.personId)?.name;

  function initiate() {
    const at = new Date().toISOString();
    // The family's side learns of the death too, if the bank hadn't recorded it there yet.
    if (!currentBereavement().losses.some((l) => l.personName === john.name))
      bereavementActions.recordLoss({
        personName: john.name,
        date: loss.date,
        reportedVia: loss.reportedVia,
        recordedOn: loss.date,
      });
    bereavementActions.initiateTransfer(personId, at);
    for (const n of transferNotices(plan))
      messagesActions.add(n.contactId, { from: "advisor", text: n.text, at, notice: true });
    setConfirming(false);
  }

  const steps = [
    {
      label: "Review the death certificate",
      detail: progress.certificate
        ? `Reviewed ${when(progress.certificate)}`
        : `Sent by ${sender}, verified by PNC Estate Services`,
      done: Boolean(progress.certificate),
      action: (
        <button
          type="button"
          onClick={() => setViewing(true)}
          className={cn(buttonClass.secondary, "px-3.5 py-1.5")}
        >
          <FileCheck2 className="size-4" aria-hidden="true" /> View certificate
        </button>
      ),
    },
    {
      label: "Offer your condolences",
      detail: progress.condolences
        ? "You've written to the family"
        : `Write to ${plan.shares
            .map((s) => personById(reachable(s.personId))?.name)
            .filter((n, i, all) => all.indexOf(n) === i)
            .join(" and ")} before anything else`,
      done: progress.condolences,
      action: (
        <Link
          href={routes.advisorMessage(reachable("p-casey"))}
          className={cn(buttonClass.secondary, "px-3.5 py-1.5")}
        >
          <MessageSquare className="size-4" aria-hidden="true" /> Message
        </Link>
      ),
    },
    {
      label: "Initiate the wealth transfer",
      detail: progress.transfer
        ? `Started ${when(progress.transfer)}; every beneficiary was told what they receive and owe`
        : "Tells every beneficiary what they receive and owe",
      done: Boolean(progress.transfer),
      action: progress.transfer ? null : (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className={cn(buttonClass.primary, "px-3.5 py-1.5")}
        >
          Initiate <ArrowRight className="size-4" aria-hidden="true" />
        </button>
      ),
    },
    {
      label: "Brief the beneficiaries' advisors",
      detail: progress.transfer
        ? "Their advisors were told with the transfer"
        : "Happens with the transfer; message them any time",
      done: Boolean(progress.transfer),
      action: null,
    },
  ];

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-medium text-pnc-ink">Estate of {john.name}</h2>
          <p className="mt-0.5 text-sm text-pnc-muted">
            Passed away {formatDate(loss.date, "medium")} · reported by{" "}
            {loss.reportedVia.toLowerCase()}
          </p>
        </div>
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold",
            progress.transfer
              ? "bg-pnc-positive-bg text-pnc-positive"
              : "bg-attention-bg text-attention",
          )}
        >
          {progress.transfer ? (
            <>
              <CircleCheck className="size-3.5" aria-hidden="true" /> Transfer started
            </>
          ) : (
            "Transfer not started"
          )}
        </span>
      </header>

      {/* Processing the will, in order. */}
      <section aria-labelledby="estate-steps-title">
        <h3 id="estate-steps-title" className="font-semibold text-pnc-ink">
          Process {john.name}&apos;s will
        </h3>
        <ol className="mt-3 divide-y divide-pnc-line rounded-lg border border-pnc-line">
          {steps.map((s, i) => (
            <li key={s.label} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
              <span
                className={cn(
                  "grid size-7 shrink-0 place-items-center rounded-full text-xs font-bold",
                  s.done ? "bg-pnc-positive-bg text-pnc-positive" : "bg-pnc-chip text-pnc-ink",
                )}
              >
                {s.done ? <CircleCheck className="size-4" aria-label="Done" /> : i + 1}
              </span>
              <span className="min-w-0 flex-1 basis-52">
                <span className="block text-sm font-semibold text-pnc-ink">{s.label}</span>
                <span className="block text-xs text-pnc-muted">{s.detail}</span>
              </span>
              {s.action}
            </li>
          ))}
        </ol>
      </section>

      <section className="flex flex-wrap items-start gap-3 rounded-lg border border-pnc-line p-4">
        <ScrollText className="mt-0.5 size-4.5 text-pnc-blue-700" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-pnc-ink">Will on file</h3>
          <p className="text-sm text-pnc-muted">
            Signed {formatDate(will.signedOn, "medium")} · executor {executor} · prepared with{" "}
            {will.attorney}. The distribution below follows it.
          </p>
        </div>
      </section>

      <section aria-labelledby="estate-plan-title">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 id="estate-plan-title" className="font-semibold text-pnc-ink">
            Beneficiaries and what passes to them
          </h3>
          <p className="flex items-center gap-2 text-xs text-pnc-muted">
            Not your clients: you can message them, not manage their accounts <MockBadge />
          </p>
        </div>
        <ul className="mt-3 divide-y divide-pnc-line rounded-lg border border-pnc-line">
          {plan.shares.map((s) => (
            <ShareRow key={s.personId} share={s} notifiedAt={progress.transfer} />
          ))}
        </ul>
      </section>

      <DeathCertificateDialog open={viewing} onClose={() => setViewing(false)} date={loss.date} />

      <Dialog
        open={confirming}
        onClose={() => setConfirming(false)}
        title="Initiate wealth transfer?"
        description={`${john.name}'s estate passes as his will directs.`}
      >
        <div className="space-y-3 px-5 py-5 text-sm text-pnc-ink">
          <p>These people will be notified now:</p>
          <ul className="space-y-1.5">
            {plan.shares.map((s) => (
              <li key={s.personId} className="flex items-center justify-between gap-3">
                <span>
                  {personById(s.personId)?.name}
                  {custodianFor[s.personId] && (
                    <span className="text-pnc-muted">
                      {" "}
                      · through {personById(custodianFor[s.personId])?.name}
                    </span>
                  )}
                </span>
                <Money value={s.net} className="font-semibold" />
              </li>
            ))}
          </ul>
          <p className="text-pnc-muted">Their own advisors are told at the same time.</p>
        </div>
        <div className="flex justify-end gap-3 border-t border-pnc-line px-5 py-4">
          <button
            type="button"
            onClick={() => setConfirming(false)}
            className={buttonClass.secondary}
          >
            Cancel
          </button>
          <button type="button" onClick={initiate} className={buttonClass.primary}>
            <Send className="size-4" aria-hidden="true" /> Initiate and notify
          </button>
        </div>
      </Dialog>
    </div>
  );
}

/**
 * One beneficiary: what passes to them and why, the debts they carry, and
 * the way to reach them and their own advisor. After the transfer starts, it
 * shows when they were told.
 */
function ShareRow({ share: s, notifiedAt }: { share: BeneficiaryShare; notifiedAt?: string }) {
  const p = personById(s.personId)!;
  const custodian = custodianFor[s.personId];
  const reach = reachable(s.personId);
  const adv = beneficiaryAdvisors[reach];
  const [open, setOpen] = useState(false);
  return (
    <li className="space-y-3 px-4 py-4">
      <PersonDetails
        personId={s.personId}
        notifiedAt={notifiedAt}
        open={open}
        onClose={() => setOpen(false)}
      />
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <div className="flex min-w-0 flex-1 basis-56 items-center gap-3">
          <PersonAvatar seed={p.id} look={p.avatar} className="size-10 ring-pnc-line" />
          <div className="min-w-0">
            <p className="font-semibold text-pnc-ink">{p.name}</p>
            <p className="text-xs text-pnc-muted">
              {beneficiaryDetail(p.id).replace(" · beneficiary", "")}
              {custodian && ` · held by ${personById(custodian)?.name} until 18`}
            </p>
            {notifiedAt && (
              <p className="flex items-center gap-1 text-xs text-pnc-positive">
                <BadgeCheck className="size-3.5" aria-hidden="true" />
                {custodian
                  ? `Notified through ${personById(custodian)?.name} · ${when(notifiedAt)}`
                  : `Notified · ${when(notifiedAt)}`}
                {` · ${adv.name} notified`}
              </p>
            )}
          </div>
        </div>
        <button type="button" onClick={() => setOpen(true)} className={chip}>
          <UserRound className="size-3.5" aria-hidden="true" /> View details
        </button>
        <div className="w-full text-right @3xl:w-32">
          <p className="text-xs text-pnc-muted">Net to {p.name}</p>
          <Money value={s.net} className="font-semibold text-pnc-ink" />
        </div>
      </div>
      <ul className="space-y-1 rounded-md bg-pnc-surface/60 px-3 py-2 text-sm">
        {s.receives.map((r) => (
          <li key={r.account.id} className="flex items-baseline justify-between gap-3">
            <span className="min-w-0 text-pnc-ink">
              {r.account.name}
              {r.account.last4 && <span className="text-pnc-muted"> x{r.account.last4}</span>}
              <span className="text-xs text-pnc-muted">
                {" "}
                · {routeLabels[r.route]}
                {r.share < 1 && ` · ${Math.round(r.share * 100)}%`}
                {r.account.external && " · paid by the insurer"}
              </span>
            </span>
            <Money value={r.amount} className="shrink-0" />
          </li>
        ))}
        {s.takesOn.map((b) => (
          <li key={b.account.id} className="flex items-baseline justify-between gap-3">
            <span className="min-w-0 text-pnc-ink">
              {b.account.name}
              {b.account.last4 && <span className="text-pnc-muted"> x{b.account.last4}</span>}
              <span className="text-xs text-pnc-muted">
                {" "}
                · debt, {Math.round(b.share * 100)}% from their share
              </span>
            </span>
            <Money value={-b.amount} className="shrink-0" />
          </li>
        ))}
      </ul>
      <div>
        <p className="text-xs font-semibold text-pnc-muted">Next steps for {p.name}</p>
        <ol className="mt-1.5 space-y-1.5">
          {beneficiarySteps(s, stepContext).map((step, i) => (
            <li key={step} className="flex gap-2.5 text-sm text-pnc-ink">
              <span className="grid size-5 shrink-0 place-items-center rounded-full bg-pnc-blue-50 text-2xs font-bold text-pnc-blue-800">
                {i + 1}
              </span>
              <span className="min-w-0">{step}</span>
            </li>
          ))}
        </ol>
      </div>
    </li>
  );
}

/** Names and relationships for the beneficiaries' next steps. */
const stepContext = {
  name: (id: string) => personById(id)?.name ?? "",
  executor: personById(willsOnFile[estateClient.personId].executor)?.name ?? "the executor",
  custodianOf: (id: string) => {
    const c = custodianFor[id];
    return c ? personById(c)?.name : undefined;
  },
  isSpouse: (id: string) => personById(id)?.relationship === "Spouse",
};

/**
 * Who a beneficiary is, for the advisor: their relationship to the deceased,
 * age, role in the estate, how to reach them and who their advisor is, then
 * the two ways to get in touch, worded alike. A minor is reached through
 * their custodian, so both actions go to the custodian and their advisor.
 */
function PersonDetails({
  personId,
  notifiedAt,
  open,
  onClose,
}: {
  personId: string;
  notifiedAt?: string;
  open: boolean;
  onClose: () => void;
}) {
  const p = personById(personId)!;
  const will = willsOnFile[estateClient.personId];
  const custodianId = custodianFor[personId];
  const custodian = custodianId ? personById(custodianId) : undefined;
  const reach = personById(reachable(personId))!;
  const adv = beneficiaryAdvisors[reach.id];
  const age = ageOn(p.birthdate, MOCK_AS_OF);
  const wards = Object.entries(custodianFor)
    .filter(([, c]) => c === personId)
    .map(([w]) => personById(w)?.name);
  const adulthood = `${Number(p.birthdate.slice(0, 4)) + 18}${p.birthdate.slice(4)}`;
  const roles = [
    will.executor === personId && "Executor of the will",
    wards.length > 0 && `Custodian for ${wards.join(" and ")}`,
    custodian &&
      `Under 18: ${custodian.name} holds their share until ${formatDate(adulthood, "medium")}`,
  ].filter(Boolean) as string[];
  const rows: [string, string][] = [
    ["Relationship", beneficiaryDetail(personId).replace(" · beneficiary", "")],
    ["Age", String(age)],
    ...roles.map((r) => ["Role", r] as [string, string]),
    ["Contact", custodian ? `Through ${custodian.name}, ${custodian.email}` : p.email],
    [custodian ? `${custodian.name}'s advisor` : "Their advisor", `${adv.name}, ${adv.team}`],
    [
      "Notified",
      notifiedAt
        ? `${custodian ? `Through ${custodian.name}, ` : ""}${when(notifiedAt)}; ${adv.name} too`
        : "Not yet. They're told when you start the transfer.",
    ],
  ];
  const action =
    "flex w-full items-center justify-between gap-3 rounded-lg px-4 py-3 text-left text-sm font-semibold ring-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pnc-link";
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={p.name}
      description="Beneficiary · not your client"
    >
      <div className="px-5 py-5">
        <div className="flex items-center gap-3">
          <PersonAvatar seed={p.id} look={p.avatar} className="size-14 ring-pnc-line" />
          <div>
            <p className="font-display text-lg font-medium text-pnc-ink">{p.name}</p>
            <p className="text-sm text-pnc-muted">
              {beneficiaryDetail(personId).replace(" · beneficiary", "")}
            </p>
          </div>
        </div>
        <dl className="mt-4 divide-y divide-pnc-line rounded-lg border border-pnc-line text-sm">
          {rows.map(([k, v], i) => (
            <div key={`${k}-${i}`} className="grid grid-cols-[7.5rem_1fr] gap-3 px-4 py-2.5">
              <dt className="text-pnc-muted">{k}</dt>
              <dd className="text-pnc-ink">{v}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-4 space-y-2">
          <Link
            href={routes.advisorMessage(reach.id)}
            className={cn(
              action,
              "bg-pnc-blue-700 text-white ring-pnc-blue-700 hover:bg-pnc-blue-800",
            )}
          >
            <span className="flex items-center gap-2">
              <MessageSquare className="size-4" aria-hidden="true" /> Message {reach.name}
            </span>
            <span className="text-xs font-normal text-white/80">
              {custodian ? `${p.name}'s custodian` : "Beneficiary"}
            </span>
          </Link>
          <Link
            href={routes.advisorMessage(adv.id)}
            className={cn(action, "bg-white text-pnc-link ring-pnc-line hover:ring-pnc-link")}
          >
            <span className="flex items-center gap-2">
              <MessageSquare className="size-4" aria-hidden="true" /> Message {adv.name}
            </span>
            <span className="text-xs font-normal text-pnc-muted">{reach.name}&apos;s advisor</span>
          </Link>
        </div>
      </div>
    </Dialog>
  );
}
