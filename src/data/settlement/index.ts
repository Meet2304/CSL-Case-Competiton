/**
 * The settlement rulebook: data only, every rule cites a source. The engine in
 * src/lib/settlement walks it; the advisor's Rulebook page renders it.
 */
import type { Rulebook } from "@/data/types";
import { actions } from "./actions";
import { federalHousehold } from "./household";
import { overlays } from "./overlays";
import { sources } from "./sources";
import { paHousehold, unmodelledStateHousehold } from "./states/pa";
import { nodes, ROOT_NODE_ID } from "./tree";

export const RULEBOOK_VERSION = "2026.10-pa-pilot";
export const RULEBOOK_AS_OF = "2026-10-26";

export const rulebook: Rulebook = {
  version: RULEBOOK_VERSION,
  asOf: RULEBOOK_AS_OF,
  rootNodeId: ROOT_NODE_ID,
  nodes,
  actions,
  overlays,
  // Federal first, then state packs; each state rule carries its own state clause.
  household: [...federalHousehold, ...paHousehold, ...unmodelledStateHousehold],
  sources,
};

export const DISCLAIMER =
  "General guidance under federal and Pennsylvania rules as reviewed on Oct 26, 2026. " +
  "Not legal or tax advice. Steps marked for review need sign-off before they're final.";

export { UNVERIFIED_SOURCE_IDS } from "./sources";
