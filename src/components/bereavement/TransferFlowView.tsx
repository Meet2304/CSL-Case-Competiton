"use client";

import { useId } from "react";
import { ArrowLeft, Check, CheckCircle2, Clock, FileUp, Sparkles } from "lucide-react";
import { Money } from "@/components/ui/Money";
import {
  docKindLabels,
  familyAsset,
  type DocKind,
  type FlowStep,
  type TransferFlow,
} from "@/data/bereavement";
import { MOCK_AS_OF } from "@/data/mock";
import { bereavementActions, useBereavement } from "@/lib/bereavement";
import { cn, formatDate } from "@/lib/format";
import { confirmKey, flowSummary, stepComplete } from "@/lib/transfer";

const kindStyles: Record<DocKind, string> = {
  upload: "bg-pnc-blue-50 text-pnc-blue-800",
  autofill: "bg-pnc-positive-bg text-pnc-positive",
  manual: "bg-pnc-orange/10 text-pnc-orange-600",
};

/** A fully modelled transfer flow: document steps, review and outcome. */
export function TransferFlowView({ flow, onBack }: { flow: TransferFlow; onBack: () => void }) {
  const state = useBereavement();
  const { progress, steps, required, doneCount, ready, status } = flowSummary(flow, state);
  const locked = status === "submitted" || status === "complete";

  const setAnswer = (key: string, value: string) =>
    bereavementActions.saveFlow(flow.id, {
      ...progress,
      answers: { ...progress.answers, [key]: value },
    });

  return (
    <div>
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1 text-sm font-semibold text-pnc-link hover:underline"
      >
        <ArrowLeft className="size-4" aria-hidden="true" /> All next steps
      </button>

      <h2 className="mt-3 font-display text-2xl font-medium text-pnc-ink">{flow.title}</h2>
      <p className="mt-1 max-w-2xl text-sm leading-relaxed text-pnc-muted">{flow.intro}</p>

      <ul className="mt-3 flex flex-wrap gap-2">
        {flow.assetIds.map((id) => {
          const a = familyAsset(id);
          return (
            <li
              key={id}
              className="rounded-md border border-pnc-line bg-white px-3 py-1.5 text-sm text-pnc-ink"
            >
              {a.name}
              {a.last4 && <span className="text-pnc-muted"> x{a.last4}</span>} ·{" "}
              <Money value={a.value} compact className="font-semibold" />
            </li>
          );
        })}
      </ul>

      <div className="mt-4 flex items-center gap-3 text-sm">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-pnc-chip" aria-hidden="true">
          <div
            className="h-full rounded-full bg-pnc-blue-700 transition-[width]"
            style={{ width: `${(doneCount / Math.max(required, 1)) * 100}%` }}
          />
        </div>
        <span className="shrink-0 font-semibold text-pnc-ink">
          {doneCount} of {required} done
        </span>
      </div>

      <ol className="mt-5 space-y-3">
        {steps.map((step, i) => (
          <StepCard
            key={step.id}
            step={step}
            number={i + 1}
            answers={progress.answers}
            complete={stepComplete(step, progress.answers, state)}
            locked={locked}
            onAnswer={setAnswer}
          />
        ))}
      </ol>

      <div className="mt-5">
        {status === "complete" ? (
          <p className="flex gap-3 rounded-md bg-pnc-positive-bg p-4 text-sm text-pnc-ink">
            <CheckCircle2 className="size-5 shrink-0 text-pnc-positive" aria-hidden="true" />
            <span>
              <span className="block font-semibold">All done.</span>
              {flow.outcome}
            </span>
          </p>
        ) : status === "submitted" ? (
          <div className="flex flex-wrap items-center gap-3 rounded-md bg-pnc-blue-50 p-4 text-sm text-pnc-ink">
            <Clock className="size-5 shrink-0 text-pnc-blue-700" aria-hidden="true" />
            <p className="min-w-0 flex-1">
              <span className="block font-semibold">Thank you — we have everything we need.</span>
              We&apos;re reviewing your documents, which usually takes {flow.reviewTime}. We&apos;ll
              let you know as soon as it&apos;s done.
            </p>
            <button
              type="button"
              onClick={() =>
                bereavementActions.saveFlow(flow.id, { ...progress, status: "complete" })
              }
              className="inline-flex items-center gap-1.5 rounded-full border border-pnc-line bg-white px-4 py-2 text-xs font-semibold text-pnc-muted hover:border-pnc-link hover:text-pnc-link"
            >
              <Sparkles className="size-3.5" aria-hidden="true" /> Demo: simulate approval
            </button>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              disabled={!ready}
              onClick={() =>
                bereavementActions.saveFlow(flow.id, { ...progress, status: "submitted" })
              }
              className="inline-flex items-center justify-center rounded-full bg-pnc-blue-700 px-6 py-2.5 text-sm font-semibold text-white hover:bg-pnc-blue-800 disabled:opacity-50"
            >
              Send to PNC
            </button>
            <span className="text-sm text-pnc-muted">
              {ready
                ? "Everything's ready. We'll review it for you."
                : `${required - doneCount} ${required - doneCount === 1 ? "step" : "steps"} left — your progress is saved.`}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function StepCard({
  step,
  number,
  answers,
  complete,
  locked,
  onAnswer,
}: {
  step: FlowStep;
  number: number;
  answers: Record<string, string>;
  complete: boolean;
  locked: boolean;
  onAnswer: (key: string, value: string) => void;
}) {
  const state = useBereavement();
  const id = useId();
  const certificate = state.deathCertificate;

  return (
    <li className="rounded-md border border-pnc-line bg-white p-4">
      <div className="flex items-start gap-3">
        <span
          className={cn(
            "grid size-7 shrink-0 place-items-center rounded-full text-xs font-bold",
            complete ? "bg-pnc-positive text-white" : "bg-pnc-chip text-pnc-ink",
          )}
          aria-label={complete ? "Done" : `Step ${number}`}
        >
          {complete ? <Check className="size-4" aria-hidden="true" /> : number}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="flex flex-wrap items-center gap-2 font-semibold text-pnc-ink">
            {step.title}
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[11px] font-semibold",
                kindStyles[step.kind],
              )}
            >
              {docKindLabels[step.kind]}
            </span>
            {step.optional && (
              <span className="rounded-full bg-pnc-chip px-2 py-0.5 text-[11px] font-semibold text-pnc-muted">
                Only if asked
              </span>
            )}
          </h3>
          <p className="mt-0.5 text-sm text-pnc-muted">{step.description}</p>

          {step.kind === "upload" && (
            <div className="mt-3">
              {certificate ? (
                <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                  <span className="inline-flex items-center gap-1.5 font-semibold text-pnc-positive">
                    <CheckCircle2 className="size-4" aria-hidden="true" /> {certificate.fileName}
                  </span>
                  <span className="text-pnc-muted">
                    Uploaded {formatDate(certificate.uploadedOn, "medium")}
                    {step.sharedCertificate && " · used for all accounts"}
                  </span>
                </p>
              ) : (
                <label
                  htmlFor={`${id}-file`}
                  className={cn(
                    "flex cursor-pointer flex-col items-center gap-1 rounded-md border-2 border-dashed border-pnc-link/40 bg-pnc-blue-50/40 px-4 py-5 text-center text-sm text-pnc-link hover:bg-pnc-blue-50",
                    locked && "pointer-events-none opacity-50",
                  )}
                >
                  <FileUp className="size-6" aria-hidden="true" />
                  <span className="font-semibold">Choose a file or take a photo</span>
                  <span className="text-xs text-pnc-muted">
                    PDF, JPG or PNG · demo only, nothing is uploaded
                  </span>
                  <input
                    id={`${id}-file`}
                    type="file"
                    accept=".pdf,image/*"
                    disabled={locked}
                    className="sr-only"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) bereavementActions.uploadCertificate(file.name, MOCK_AS_OF);
                    }}
                  />
                </label>
              )}
            </div>
          )}

          {step.kind === "autofill" && (
            <div className="mt-3">
              <dl className="grid gap-x-6 gap-y-1.5 rounded-md bg-pnc-surface p-3 text-sm @lg:grid-cols-[auto_1fr]">
                {step.prefill?.map((row) => (
                  <div key={row.label} className="contents">
                    <dt className="text-pnc-muted">{row.label}</dt>
                    <dd className="font-semibold text-pnc-ink">{row.value}</dd>
                  </div>
                ))}
              </dl>
              <label className="mt-3 flex items-start gap-2 text-sm text-pnc-ink">
                <input
                  type="checkbox"
                  className="mt-0.5 size-4 accent-pnc-blue-700"
                  disabled={locked}
                  checked={answers[confirmKey(step.id)] === "yes"}
                  onChange={(e) => onAnswer(confirmKey(step.id), e.target.checked ? "yes" : "")}
                />
                {step.confirmLabel}
              </label>
            </div>
          )}

          {step.kind === "manual" &&
            step.fields?.map((field) =>
              field.type === "choice" ? (
                <fieldset key={field.id} className="mt-3">
                  <legend className="sr-only">{field.label}</legend>
                  <div className="grid gap-2">
                    {field.options?.map((o) => {
                      const selected = answers[field.id] === o.value;
                      return (
                        <label
                          key={o.value}
                          className={cn(
                            "flex cursor-pointer gap-3 rounded-md border p-3 text-sm",
                            selected
                              ? "border-pnc-link bg-pnc-blue-50/60"
                              : "border-pnc-line hover:border-pnc-link/50",
                            locked && "cursor-default",
                          )}
                        >
                          <input
                            type="radio"
                            name={`${id}-${field.id}`}
                            value={o.value}
                            checked={selected}
                            disabled={locked}
                            onChange={() => onAnswer(field.id, o.value)}
                            className="mt-0.5 size-4 accent-pnc-blue-700"
                          />
                          <span>
                            <span className="block font-semibold text-pnc-ink">{o.label}</span>
                            {o.help && <span className="block text-pnc-muted">{o.help}</span>}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </fieldset>
              ) : (
                <div key={field.id} className="mt-3 max-w-md">
                  <label
                    htmlFor={`${id}-${field.id}`}
                    className="block text-sm font-semibold text-pnc-ink"
                  >
                    {field.label}
                  </label>
                  {field.type === "select" ? (
                    <select
                      id={`${id}-${field.id}`}
                      value={answers[field.id] ?? ""}
                      disabled={locked}
                      onChange={(e) => onAnswer(field.id, e.target.value)}
                      className="mt-1 w-full rounded-md border border-pnc-line bg-white px-3 py-2.5 text-sm outline-none focus:border-pnc-link"
                    >
                      <option value="" disabled>
                        Choose…
                      </option>
                      {field.options?.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      id={`${id}-${field.id}`}
                      value={answers[field.id] ?? ""}
                      placeholder={field.placeholder}
                      disabled={locked}
                      onChange={(e) => onAnswer(field.id, e.target.value)}
                      className="mt-1 w-full rounded-md border border-pnc-line bg-white px-3 py-2.5 text-sm outline-none focus:border-pnc-link"
                    />
                  )}
                </div>
              ),
            )}
        </div>
      </div>
    </li>
  );
}
