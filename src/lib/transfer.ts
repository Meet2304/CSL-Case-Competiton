/**
 * Progress rules for the survivor's transfer flows. Completion is derived
 * from what the customer has provided, so it can never drift out of sync.
 */
import { visibleSteps, type FlowStep, type TransferFlow } from "@/data/bereavement";
import { flowProgress, type BereavementState, type FlowStatus } from "@/lib/bereavement";

export const confirmKey = (stepId: string) => `confirm:${stepId}`;

export function stepComplete(step: FlowStep, answers: Record<string, string>, s: BereavementState) {
  if (step.kind === "upload") return Boolean(s.deathCertificate);
  if (step.kind === "autofill") return answers[confirmKey(step.id)] === "yes";
  return (step.fields ?? []).every((f) => Boolean(answers[f.id]?.trim()));
}

export function flowSummary(flow: TransferFlow, s: BereavementState) {
  const progress = flowProgress(s, flow.id);
  const steps = visibleSteps(flow, progress.answers);
  const required = steps.filter((st) => !st.optional);
  const doneCount = required.filter((st) => stepComplete(st, progress.answers, s)).length;
  const ready = doneCount === required.length;
  const status: FlowStatus =
    progress.status === "submitted" || progress.status === "complete"
      ? progress.status
      : steps.some((st) => stepComplete(st, progress.answers, s))
        ? "in-progress"
        : "not-started";
  return { progress, steps, required: required.length, doneCount, ready, status };
}

export const statusLabels: Record<FlowStatus, string> = {
  "not-started": "Not started",
  "in-progress": "In progress",
  submitted: "In review",
  complete: "Complete",
};
