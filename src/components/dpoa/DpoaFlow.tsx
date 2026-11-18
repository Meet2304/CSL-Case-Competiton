"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import {
  ArrowRight,
  BadgeCheck,
  Check,
  CircleCheck,
  FileSignature,
  Send,
  UserRound,
  Video,
} from "lucide-react";
import { useViewer } from "@/components/customer/Viewer";
import { PersonAvatar } from "@/components/ui/PersonAvatar";
import { buttonClass } from "@/components/will/ui";
import {
  DPOA_FULL_NAME,
  dpoaMatters,
  dpoaReview,
  dpoaSigning,
  dpoaStarts,
  dpoaSteps,
  type DpoaStart,
  type DpoaStepId,
} from "@/data/dpoa";
import { people } from "@/data/household";
import { MOCK_AS_OF } from "@/data/mock";
import { readDpoa, sendDpoa, useDpoaSent } from "@/lib/dpoa";
import { cn, formatDate } from "@/lib/format";
import { ageOn, firstName, personById } from "@/lib/household";
import { routes } from "@/lib/routes";

const panel = "rounded-lg bg-white shadow-card";

/**
 * Set up a Durable Power of Attorney (DPOA), `routes.dpoa`: choose an agent,
 * choose what they may handle and when, review the document, sign it with
 * witnesses and a notary, and send it to PNC to review and register. Every
 * step is a demonstration: nothing is signed, notarized or registered.
 */
export function DpoaFlow() {
  const { person, deceasedIds, isMinor } = useViewer();
  const sent = useDpoaSent(person.id);
  const [step, setStep] = useState<DpoaStepId>("people");
  const [agentId, setAgentId] = useState<string | null>(null);
  const [matters, setMatters] = useState<string[]>(
    dpoaMatters.filter((m) => !("off" in m && m.off)).map((m) => m.id),
  );
  const [start, setStart] = useState<DpoaStart>("now");
  const [signed, setSigned] = useState(false);

  if (isMinor)
    return (
      <p className={cn(panel, "px-6 py-10 text-center text-sm text-pnc-muted")}>
        You can set up a {DPOA_FULL_NAME} once you turn 18.
      </p>
    );

  const record = sent ? readDpoa(person.id) : null;
  if (record) return <Sent agentId={record.agentId} sentOn={record.sentOn} />;

  // Adults in the family who could act for you.
  const candidates = people.filter(
    (p) =>
      p.id !== person.id &&
      (p.relationship === "Spouse" || p.relationship === "Child") &&
      !deceasedIds.includes(p.id) &&
      ageOn(p.birthdate, MOCK_AS_OF) >= 18,
  );
  const agent = agentId ? personById(agentId) : undefined;
  const index = dpoaSteps.findIndex((s) => s.id === step);
  const next = () => setStep(dpoaSteps[index + 1].id);

  return (
    <div className={panel}>
      <Stepper current={index} />

      <div className="border-t border-pnc-line px-5 py-6 @2xl:px-8">
        {step === "people" && (
          <Step
            title="Who can act for you?"
            intro="Your agent can handle your finances if you can't. Choose someone you trust completely."
          >
            <div className="grid gap-4 @3xl:grid-cols-2">
              <Box label="You, the principal">
                <PersonLine
                  id={person.id}
                  detail={`Born ${formatDate(person.birthdate, "medium")}`}
                />
              </Box>
              <Box label="Your agent">
                <ul className="space-y-2">
                  {candidates.map((p) => (
                    <li key={p.id}>
                      <button
                        type="button"
                        aria-pressed={agentId === p.id}
                        onClick={() => setAgentId(p.id)}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left ring-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pnc-link",
                          agentId === p.id
                            ? "bg-pnc-blue-50 ring-2 ring-pnc-blue-700"
                            : "ring-pnc-line hover:ring-pnc-muted",
                        )}
                      >
                        <PersonAvatar seed={p.id} look={p.avatar} className="size-8" />
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-semibold text-pnc-ink">{p.name}</span>
                          <span className="block text-xs text-pnc-muted">{p.relationship}</span>
                        </span>
                        {agentId === p.id && (
                          <Check className="size-4 text-pnc-blue-700" aria-hidden="true" />
                        )}
                      </button>
                    </li>
                  ))}
                  <li className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm text-pnc-muted ring-1 ring-dashed ring-pnc-line">
                    <UserRound className="size-5" aria-hidden="true" /> Someone else (add their name
                    and contact details)
                  </li>
                </ul>
                <p className="mt-3 text-xs text-pnc-muted">
                  Optional: a successor agent, if your agent can&apos;t act. You can add one later.
                </p>
              </Box>
            </div>
            <Footer>
              <button
                type="button"
                disabled={!agent}
                onClick={next}
                className={buttonClass.primary}
              >
                Continue <ArrowRight className="size-4" aria-hidden="true" />
              </button>
            </Footer>
          </Step>
        )}

        {step === "powers" && agent && (
          <Step
            title={`What can ${firstName(agent.name)} handle?`}
            intro="Choose the financial matters your agent may look after, and when that begins."
          >
            <div className="grid gap-4 @3xl:grid-cols-[minmax(0,1fr)_18rem]">
              <Box label="Financial matters">
                <ul className="divide-y divide-pnc-line">
                  {dpoaMatters.map((m) => {
                    const on = matters.includes(m.id);
                    return (
                      <li key={m.id}>
                        <label className="flex cursor-pointer items-start gap-3 py-2.5">
                          <input
                            type="checkbox"
                            checked={on}
                            onChange={() =>
                              setMatters(
                                on ? matters.filter((x) => x !== m.id) : [...matters, m.id],
                              )
                            }
                            className="mt-0.5 size-4 accent-pnc-blue-700"
                          />
                          <span>
                            <span className="block text-sm font-semibold text-pnc-ink">
                              {m.label}
                            </span>
                            <span className="block text-xs text-pnc-muted">{m.detail}</span>
                          </span>
                        </label>
                      </li>
                    );
                  })}
                </ul>
              </Box>
              <Box label="When it starts">
                <div className="space-y-2">
                  {dpoaStarts.map((s) => (
                    <label
                      key={s.id}
                      className={cn(
                        "flex cursor-pointer items-start gap-3 rounded-md px-3 py-2.5 ring-1",
                        start === s.id ? "bg-pnc-blue-50 ring-pnc-blue-700" : "ring-pnc-line",
                      )}
                    >
                      <input
                        type="radio"
                        name="dpoa-start"
                        checked={start === s.id}
                        onChange={() => setStart(s.id)}
                        className="mt-0.5 size-4 accent-pnc-blue-700"
                      />
                      <span>
                        <span className="block text-sm font-semibold text-pnc-ink">{s.label}</span>
                        <span className="block text-xs text-pnc-muted">{s.detail}</span>
                      </span>
                    </label>
                  ))}
                </div>
              </Box>
            </div>
            <Footer>
              <button
                type="button"
                disabled={matters.length === 0}
                onClick={next}
                className={buttonClass.primary}
              >
                Continue <ArrowRight className="size-4" aria-hidden="true" />
              </button>
            </Footer>
          </Step>
        )}

        {step === "review" && agent && (
          <Step
            title="Review your DPOA"
            intro="Prepared from your answers. Have an attorney look it over before you sign."
          >
            <Document principal={person.name} agent={agent.name} matters={matters} start={start} />
            <Footer>
              <button type="button" onClick={next} className={buttonClass.primary}>
                Continue to signing <ArrowRight className="size-4" aria-hidden="true" />
              </button>
            </Footer>
          </Step>
        )}

        {step === "sign" && agent && (
          <Step
            title="Sign it"
            intro={`Pennsylvania asks for all four (${dpoaSigning.source}). You can do it in one online session with a notary.`}
          >
            <ol className="grid gap-2 @3xl:grid-cols-2">
              {dpoaSigning.steps.map((s, i) => (
                <li
                  key={s}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-4 py-3 text-sm ring-1 transition-colors",
                    signed ? "bg-pnc-positive-bg/60 ring-pnc-positive/30" : "ring-pnc-line",
                  )}
                >
                  <span
                    className={cn(
                      "grid size-7 shrink-0 place-items-center rounded-full text-xs font-semibold",
                      signed ? "bg-pnc-positive text-white" : "bg-pnc-chip text-pnc-ink",
                    )}
                  >
                    {signed ? <Check className="size-4" aria-label="Done" /> : i + 1}
                  </span>
                  <span className="text-pnc-ink">
                    {i === 3 ? s.replace("Your agent", agent.name) : s}
                  </span>
                </li>
              ))}
            </ol>
            {signed && (
              <p className="mt-3 flex items-center gap-2 text-sm text-pnc-muted">
                <BadgeCheck className="size-4 text-pnc-positive" aria-hidden="true" />
                Signed online with {dpoaSigning.notary} · {formatDate(MOCK_AS_OF, "medium")} · demo
                only, nothing was signed
              </p>
            )}
            <Footer>
              {signed ? (
                <button
                  type="button"
                  onClick={() => {
                    sendDpoa(person.id, { agentId: agent.id, matters, start });
                  }}
                  className={buttonClass.primary}
                >
                  <Send className="size-4" aria-hidden="true" /> Send to PNC for review
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setSigned(true)}
                  className={buttonClass.primary}
                >
                  <Video className="size-4" aria-hidden="true" /> Sign online with a notary
                </button>
              )}
            </Footer>
          </Step>
        )}
      </div>
    </div>
  );
}

/**
 * The five steps across the top, with the ones behind you checked. Each connecting line runs
 * from one circle's edge to the next, behind the circles. Finishing a step plays in order: its
 * circle fills and its check pops in, then the line to the next step fills, then the next
 * circle lights up, so moving quickly through the steps reads as one run of checks.
 */
function Stepper({ current }: { current: number }) {
  return (
    <ol className="flex items-start px-4 pb-4 pt-5 @2xl:px-8">
      {dpoaSteps.map((s, i) => {
        const done = i < current;
        const now = i === current;
        return (
          <li key={s.id} className="relative flex flex-1 flex-col items-center">
            {i > 0 && (
              <span
                aria-hidden="true"
                className="absolute right-[calc(50%+0.875rem)] top-3.5 h-0.5 w-[calc(100%-1.75rem)] -translate-y-1/2 overflow-hidden bg-pnc-line"
              >
                <span
                  className={cn(
                    "block h-full origin-left bg-pnc-blue-700 transition-transform duration-300 ease-out motion-reduce:transition-none",
                    done || now ? "scale-x-100 delay-200" : "scale-x-0",
                  )}
                />
              </span>
            )}
            <span
              aria-hidden="true"
              className={cn(
                "relative z-10 grid size-7 place-items-center rounded-full text-xs font-semibold transition-[background-color,color,box-shadow] duration-300 ease-out motion-reduce:transition-none",
                done
                  ? "bg-pnc-blue-700 text-white"
                  : now
                    ? "bg-white text-pnc-blue-700 ring-2 ring-pnc-blue-700 delay-500"
                    : "bg-white text-pnc-muted ring-1 ring-pnc-line",
              )}
            >
              <Check
                className={cn(
                  "col-start-1 row-start-1 size-4 transition-[opacity,scale] duration-300 ease-out motion-reduce:transition-none",
                  done ? "scale-100 opacity-100" : "scale-50 opacity-0",
                )}
                strokeWidth={3}
              />
              <span
                className={cn(
                  "col-start-1 row-start-1 transition-opacity duration-150 motion-reduce:transition-none",
                  done && "opacity-0",
                )}
              >
                {i + 1}
              </span>
            </span>
            <span
              className={cn(
                "mt-1.5 text-center text-xs",
                now ? "font-semibold text-pnc-ink" : "text-pnc-muted",
              )}
            >
              <span className="sr-only">
                Step {i + 1}, {done ? "done" : now ? "current" : "to do"}:{" "}
              </span>
              {s.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function Step({ title, intro, children }: { title: string; intro: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="font-display text-2xl font-medium text-pnc-ink">{title}</h2>
      <p className="mt-1 max-w-2xl text-sm leading-relaxed text-pnc-muted">{intro}</p>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function Box({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="rounded-lg border border-pnc-line p-4">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-pnc-muted">{label}</p>
      {children}
    </div>
  );
}

function PersonLine({ id, detail }: { id: string; detail: string }) {
  const p = personById(id)!;
  return (
    <p className="flex items-center gap-3">
      <PersonAvatar seed={p.id} look={p.avatar} className="size-9" />
      <span>
        <span className="block text-sm font-semibold text-pnc-ink">{p.name}</span>
        <span className="block text-xs text-pnc-muted">{detail}</span>
      </span>
    </p>
  );
}

const Footer = ({ children }: { children: ReactNode }) => (
  <div className="mt-6 flex flex-wrap justify-end gap-3 border-t border-pnc-line pt-4">
    {children}
  </div>
);

/** The DPOA as it would be printed, from the answers. */
function Document({
  principal,
  agent,
  matters,
  start,
}: {
  principal: string;
  agent: string;
  matters: string[];
  start: DpoaStart;
}) {
  const powers = dpoaMatters
    .filter((m) => matters.includes(m.id))
    .map((m) => m.label.toLowerCase());
  const list =
    powers.length > 1 ? `${powers.slice(0, -1).join(", ")} and ${powers.at(-1)}` : powers[0];
  const clauses = [
    `I, ${principal}, appoint ${agent} as my agent.`,
    `My agent may act for me in these matters: ${list}.`,
    start === "now"
      ? "This power of attorney takes effect when it is signed and registered."
      : "This power of attorney takes effect only if a physician certifies in writing that I cannot manage my own affairs.",
    "This power of attorney is durable: it stays in effect if I become incapacitated, and it ends at my death.",
  ];
  return (
    <div className="rounded-lg bg-pnc-surface px-3 py-6 @2xl:px-8">
      <article className="mx-auto max-w-2xl rounded-sm bg-white px-8 py-8 font-[Georgia,'Times_New_Roman',serif] text-pnc-ink shadow-card">
        <p className="text-center text-xs uppercase tracking-[0.3em] text-pnc-muted">
          {DPOA_FULL_NAME}
        </p>
        <p className="mt-1 text-center text-xl">of {principal}</p>
        <ol className="mt-6 space-y-3 text-[0.9375rem] leading-relaxed">
          {clauses.map((c, i) => (
            <li key={c} className="flex gap-3">
              <span className="text-pnc-muted">{["I.", "II.", "III.", "IV."][i]}</span>
              <span>{c}</span>
            </li>
          ))}
        </ol>
        <p className="mt-6 flex items-center gap-2 border-t border-pnc-line pt-3 font-sans text-xs text-pnc-muted">
          <FileSignature className="size-4" aria-hidden="true" /> Includes the notice to the
          principal and the agent&apos;s acknowledgment Pennsylvania requires.
        </p>
      </article>
    </div>
  );
}

/** Sent to PNC: what happens next, and what doesn't change yet. */
function Sent({ agentId, sentOn }: { agentId: string; sentOn: string }) {
  const agent = personById(agentId);
  return (
    <div className={cn(panel, "px-6 py-8 @2xl:px-10")}>
      <span className="inline-flex items-center gap-2 rounded-full bg-pnc-blue-50 px-3 py-1 text-xs font-semibold text-pnc-blue-800">
        <CircleCheck className="size-4" aria-hidden="true" /> Sent to PNC ·{" "}
        {formatDate(sentOn, "medium")}
      </span>
      <h2 className="mt-4 font-display text-3xl font-medium text-pnc-ink">
        Your DPOA is with PNC for review
      </h2>
      <p className="mt-2 max-w-xl text-md leading-relaxed text-pnc-muted">
        {agent ? `${agent.name} is your agent. ` : ""}PNC reviews and registers it, usually within{" "}
        {dpoaReview.time}. {dpoaReview.after} {dpoaReview.separate}
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link href={routes.home} className={buttonClass.primary}>
          Back to Home <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}
