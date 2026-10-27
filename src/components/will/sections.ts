import type { sections } from "@/lib/will/flow";

type Section = (typeof sections)[number];

/**
 * How each planner section is presented: a short name for the progress bar,
 * a plain-English name (the legal term stays in the will itself) and a
 * one-line description.
 */
export const sectionMeta: Record<Section, { short: string; label: string; blurb: string }> = {
  Basics: { short: "About you", label: "About you", blurb: "Your name, address and family status" },
  Nominees: {
    short: "Guardians",
    label: "Children & guardians",
    blurb: "Who would look after your children and pets",
  },
  Assets: { short: "Assets", label: "What you own", blurb: "A rough picture of your estate" },
  Residuary: {
    short: "Inheritance",
    label: "Who inherits",
    blurb: "Who receives the rest of your estate",
  },
  Gifts: {
    short: "Gifts",
    label: "Specific gifts",
    blurb: "Particular items or sums for someone",
  },
  Funeral: { short: "Funeral", label: "Funeral wishes", blurb: "How you'd like to be remembered" },
  Provisions: {
    short: "Executor",
    label: "Executor & clauses",
    blurb: "Who carries out your wishes, and final instructions",
  },
  Review: { short: "Review", label: "Review & sign", blurb: "Check everything, then sign" },
};
