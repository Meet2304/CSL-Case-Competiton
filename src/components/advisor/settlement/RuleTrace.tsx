import { ArrowRight, CircleHelp, Quote, TriangleAlert } from "lucide-react";
import { Chip } from "@/components/advisor/assistant/parts";
import type { AccountPlan } from "@/lib/settlement/engine";
import { formatDate } from "@/lib/format";
import { firstName, ownerLabel, reviewLabels, reviewTone } from "./parts";
import { SourceChips } from "./SourceChip";

const h5 = "text-xs font-bold uppercase tracking-wide text-pnc-muted";

/**
 * Why one account ends up where it does: the decisions taken, the facts and
 * law behind each, the extra rules that apply, the steps in order and what
 * the client would read.
 */
export function RuleTrace({
  plan,
  survivor,
  mode,
  onAsk,
}: {
  plan: AccountPlan;
  survivor: string;
  mode: "settlement" | "simulation";
  onAsk?: (q: string) => void;
}) {
  const { outcome } = plan;
  return (
    <div className="space-y-5 text-sm leading-relaxed">
      <p className="text-md text-pnc-ink">{plan.summary}</p>

      <section aria-label="Decision path">
        <h5 className={h5}>How the rulebook decided</h5>
        <ol className="mt-2 space-y-2">
          {plan.trace.map((t, i) => (
            <li key={t.nodeId} className="flex gap-3">
              <span
                className="grid size-6 shrink-0 place-items-center rounded-full bg-pnc-blue-50 text-xs font-semibold text-pnc-blue-800"
                aria-hidden="true"
              >
                {i + 1}
              </span>
              <div className="min-w-0 flex-1 space-y-1">
                <p className="text-pnc-ink">
                  {t.question}{" "}
                  <span className="font-semibold">
                    <ArrowRight className="inline size-3.5" aria-hidden="true" />
                    <span className="sr-only">Answer:</span> {t.answer}
                  </span>
                </p>
                <p className="text-xs text-pnc-muted">Evidence: {t.evidence}</p>
                <SourceChips ids={t.sources} />
              </div>
            </li>
          ))}
          <li className="flex gap-3">
            <span
              className="grid size-6 shrink-0 place-items-center rounded-full bg-pnc-blue-700 text-white"
              aria-hidden="true"
            >
              <ArrowRight className="size-3.5" />
            </span>
            <div className="min-w-0 flex-1 space-y-1">
              <p className="font-semibold text-pnc-ink">Outcome: {plan.title}</p>
              <p className="text-xs text-pnc-muted">
                Typical time {outcome.typicalTimeline}
                {outcome.probate ? " · goes through probate" : " · outside probate"}
              </p>
              <SourceChips ids={outcome.sources} />
            </div>
          </li>
        </ol>
      </section>

      {plan.overlays.length > 0 && (
        <section aria-label="Also applies">
          <h5 className={h5}>Also applies</h5>
          <ul className="mt-2 space-y-2">
            {plan.overlays.map((ov) => (
              <li key={ov.id} className="space-y-1">
                <p className="text-pnc-ink">
                  {ov.attention && (
                    <TriangleAlert
                      className="mr-1 inline size-3.5 text-pnc-orange-600"
                      aria-label="Needs attention"
                    />
                  )}
                  <span className="font-semibold">{ov.title}.</span> {ov.detail}
                </p>
                <SourceChips ids={ov.sources} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {plan.actions.length > 0 && (
        <section aria-label="Steps">
          <h5 className={h5}>Steps, in order</h5>
          <ol className="mt-2 list-decimal space-y-1 pl-5 marker:text-pnc-muted">
            {plan.actions.map((a) => (
              <li key={a.key} className="text-pnc-ink">
                {a.label}{" "}
                <span className="text-xs text-pnc-muted">
                  · {ownerLabel(a.action.owner, firstName(survivor))}
                  {a.due &&
                    ` · ${mode === "simulation" ? "would be due" : "due"} ${formatDate(a.due, "medium")}`}
                </span>
              </li>
            ))}
          </ol>
        </section>
      )}

      {plan.openQuestions.length > 0 && (
        <section aria-label="Open questions">
          <h5 className={h5}>Still to find out</h5>
          <ul className="mt-2 space-y-1.5">
            {plan.openQuestions.map((q) => (
              <li key={q.key} className="flex flex-wrap items-start gap-x-2 gap-y-1">
                <CircleHelp
                  className="mt-0.5 size-4 shrink-0 text-pnc-blue-700"
                  aria-hidden="true"
                />
                <span className="min-w-0 flex-1 text-pnc-ink">{q.question}</span>
                {onAsk && (
                  <button
                    type="button"
                    onClick={() => onAsk(q.question)}
                    className="text-xs font-semibold text-pnc-link hover:underline"
                  >
                    Ask
                  </button>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {plan.assumptions.length > 0 && (
        <section aria-label="Assumptions">
          <h5 className={h5}>Assumed</h5>
          <ul className="mt-1 list-disc space-y-0.5 pl-5 text-pnc-muted">
            {plan.assumptions.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>
        </section>
      )}

      {mode === "settlement" && (
        <figure className="rounded-md bg-pnc-surface px-4 py-3">
          <figcaption className={h5}>For {firstName(survivor)}, in plain words</figcaption>
          <blockquote className="mt-1 flex gap-2 italic text-pnc-ink">
            <Quote className="mt-1 size-3.5 shrink-0 text-pnc-blue-700" aria-hidden="true" />
            {plan.plain}
          </blockquote>
        </figure>
      )}

      {plan.review.length > 0 && (
        <p className="flex flex-wrap items-center gap-1.5 text-xs text-pnc-muted">
          Needs sign-off:
          {plan.review.map((r) => (
            <Chip key={r} className={reviewTone}>
              {reviewLabels[r]}
            </Chip>
          ))}
        </p>
      )}
    </div>
  );
}
