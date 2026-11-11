/**
 * The script of the product film (`/film`): which page of the working app each
 * shot is filmed on, what is clicked, and what the camera frames. Captions are
 * one headline and one sentence; the presenter says the rest. People are
 * named by role only (Husband, Wife, Child 1, Child 2, Bank Advisor).
 *
 * Targets describe elements by the words on them, so the film keeps working
 * when the app's markup changes but its labels do not.
 */
import type { FilmChapterId, FilmScene, FilmShot, Target } from "@/lib/film";

export const filmChapters: { id: FilmChapterId; label: string }[] = [
  { id: "before", label: "Before a loss" },
  { id: "day", label: "The day it happens" },
  { id: "after", label: "After the loss" },
  { id: "close", label: "Summary" },
];

/** The white card (or side list) that holds this heading. */
const card = (text: string, closest = ".shadow-card"): Target => ({ text, closest });

const FAMILY = "/family#fam-sample";

export const filmScenes: Record<string, FilmScene> = {
  "husband-home": {
    as: "husband",
    world: "before",
    path: "/home",
    ready: { text: "Your money at a glance" },
  },
  "husband-family": {
    as: "husband",
    world: "before",
    path: FAMILY,
    ready: { text: "Shared assets" },
  },
  "child-family": {
    as: "child1",
    world: "before",
    path: FAMILY,
    ready: { text: "Shared with you" },
  },
  "advisor-home": {
    as: "advisor",
    world: "before",
    path: "/advisor",
    ready: { text: "Your Customers" },
  },
  "advisor-client": {
    as: "advisor",
    world: "after",
    path: "/advisor/clients/c-sample",
    ready: { text: "Where things stand" },
  },
  "wife-home": {
    as: "wife",
    world: "after",
    path: "/home",
    ready: { text: "Your money at a glance" },
  },
  "wife-family": { as: "wife", world: "after", path: FAMILY, ready: { text: "Shared assets" } },
  "wife-assets": {
    as: "wife",
    world: "after",
    path: "/assets#unclaimed",
    ready: { text: "accounts that can pass to you" },
  },
  "child-home": {
    as: "child1",
    world: "after",
    path: "/home",
    ready: { text: "Your money at a glance" },
  },
};

const findoePanel = "aside.findoe-panel";
const QUESTION = "How do I claim the 401(k) Rollover IRA?";

export const filmShots: FilmShot[] = [
  // --- Before a loss -------------------------------------------------------
  {
    id: "open",
    chapter: "before",
    title: "One family, before and after a loss",
    body: "This is the working software. Every screen is live.",
  },
  {
    id: "home",
    chapter: "before",
    scene: "husband-home",
    title: "Husband's home page",
    body: "He runs the family's money. This is what he sees.",
  },
  {
    id: "one-view",
    chapter: "before",
    scene: "husband-home",
    title: "Every asset in one view",
    body: "It includes the life policy he holds outside PNC.",
    focus: card("Your money at a glance"),
    mark: { text: "term life policy held outside PNC" },
  },
  {
    id: "gaps",
    chapter: "before",
    scene: "husband-home",
    title: "Gaps are flagged early",
    body: "This account has no beneficiary, so it would go through probate.",
    focus: card("Notifications"),
    mark: { text: "Add a beneficiary to Savings x0002", closest: "li" },
  },
  {
    id: "family",
    chapter: "before",
    scene: "husband-family",
    title: "The family dashboard",
    body: "Husband shares his accounts with the people he trusts.",
  },
  {
    id: "shared",
    chapter: "before",
    scene: "husband-family",
    title: "Each account shows who can see it",
    body: "The faces on a row are the people with access.",
    focus: card("Shared assets"),
    fit: "width",
    maxZoom: 1.6,
  },
  {
    id: "people",
    chapter: "before",
    scene: "husband-family",
    title: "Everyone has a role",
    body: "Husband and Wife are admins. Each child has their own role.",
    focus: { text: "People", exact: true, closest: "aside" },
  },
  {
    id: "roles",
    chapter: "before",
    scene: "husband-family",
    title: "Admins decide who sees what",
    body: "Every role has its own access.",
    actions: [
      { do: "click", on: { css: "button", text: "Manage family" } },
      { do: "click", on: { css: "[role=tab]", text: "Roles & access" } },
      { do: "wait", for: { text: "Sees the household checking account" } },
    ],
    focus: { text: "Sees the household checking account", closest: "ul" },
  },
  {
    id: "access",
    chapter: "before",
    scene: "husband-family",
    title: "Access is set account by account",
    body: "Child 1 can see the joint checking account and nothing else.",
    actions: [
      { do: "click", on: { text: "Sees the household checking account", closest: "button" } },
      { do: "wait", for: { text: "Segmented access control" } },
    ],
    focus: { css: "dialog[open] table" },
    mark: { css: "dialog[open] tr", text: "Joint Checking x0001" },
  },
  {
    id: "child",
    chapter: "before",
    scene: "child-family",
    title: "What Child 1 sees",
    body: "Only the account shared with them. Nothing shows what is hidden.",
    // The heading, not the count above it that carries the same words.
    focus: { css: "h3", text: "Shared with you", closest: ".shadow-card" },
  },

  // --- The day it happens --------------------------------------------------
  {
    id: "loss",
    chapter: "day",
    title: "Husband passes away",
    body: "The bank hears by phone.",
  },
  {
    id: "record",
    chapter: "day",
    scene: "advisor-home",
    title: "The bank records the death",
    body: "The Bank Advisor enters who died and how the bank heard.",
    actions: [
      { do: "look", at: card("Your Customers") },
      { do: "click", on: { css: "button", text: "More actions" } },
      { do: "click", on: { css: "[role=menuitem]", text: "Record a death notice" } },
      { do: "wait", for: { css: "dialog[open] form" } },
    ],
    focus: { css: "dialog[open]" },
  },
  {
    id: "notified",
    chapter: "day",
    scene: "advisor-home",
    title: "The Bank Advisor knows what to do first",
    body: "Call Wife. Lead with condolences, not paperwork.",
    actions: [
      { do: "click", on: { css: "dialog[open] button", text: "Record and notify" } },
      { do: "wait", for: { css: 'section[aria-label="Death recorded: Husband"]' } },
    ],
    focus: { css: 'section[aria-label="Death recorded: Husband"]' },
  },
  {
    id: "standing",
    chapter: "day",
    scene: "advisor-client",
    title: "The full picture before the first call",
    body: "What passes to Wife, what goes through probate, and the next date.",
    focus: { text: "Where things stand", closest: "section" },
  },
  {
    id: "plan",
    chapter: "day",
    scene: "advisor-client",
    title: "A plan that starts with condolences",
    body: "People first. The account work follows.",
    focus: { text: "to offer condolences", closest: "ol" },
    mark: { text: "to offer condolences", closest: "li" },
    fit: "width",
    maxZoom: 1.8,
  },
  {
    id: "decided",
    chapter: "day",
    scene: "advisor-client",
    title: "Findoe shows how it decided",
    body: "Fixed rules decide each account. The AI explains them.",
    actions: [
      { do: "click", on: { text: "How I decided", closest: "button" } },
      { do: "wait", for: { text: "Sole owner" } },
    ],
    focus: { text: "How I decided", closest: "aside" },
    fit: "width",
    maxZoom: 2,
  },
  {
    id: "asks",
    chapter: "day",
    scene: "advisor-client",
    title: "When unsure, Findoe asks",
    body: "It never guesses a fact it cannot see.",
    focus: { css: 'section[aria-labelledby="findoe-question"]' },
  },

  // --- After the loss ------------------------------------------------------
  {
    id: "condolence",
    chapter: "after",
    scene: "wife-home",
    title: "Wife is met with care",
    body: "Nothing is urgent. There is one link, for when she is ready.",
    // The strip's content column, not the full-width strip itself.
    focus: { text: "so sorry for the loss of Husband", closest: ".max-w-7xl" },
  },
  {
    id: "ahead",
    chapter: "after",
    scene: "wife-home",
    title: "The bank looks ahead for her",
    body: "Her own savings still names Husband, so she is asked to update it.",
    focus: card("Looking after Husband's accounts"),
    mark: { text: "Update the beneficiary on Savings x0021", closest: "li" },
  },
  {
    id: "family-after",
    chapter: "after",
    scene: "wife-family",
    title: "The family dashboard after the loss",
    body: "Husband is marked deceased. The family and its accounts stay together.",
    focus: { text: "People", exact: true, closest: "aside" },
    mark: { text: "Deceased", exact: true, closest: "li" },
  },
  {
    id: "unclaimed",
    chapter: "after",
    scene: "wife-assets",
    title: "One list of everything he left",
    body: "Each account that passes to her, with the reason.",
    focus: { css: 'ul[aria-label="Accounts you can claim"]' },
    maxZoom: 1.6,
  },
  {
    id: "claim",
    chapter: "after",
    scene: "wife-assets",
    title: "Each claim is a short checklist",
    body: "The form is already filled in from the bank's records.",
    actions: [
      { do: "click", on: { css: "button", text: "Start claim for 401(k)" } },
      { do: "wait", for: { text: "Beneficiary claim form" } },
      { do: "look", at: { text: "Beneficiary claim form", closest: "li" } },
      { do: "click", on: { text: "The details are correct" } },
    ],
    focus: { text: "Beneficiary claim form", closest: "li" },
  },
  {
    id: "ask",
    chapter: "after",
    scene: "wife-assets",
    title: "Answers from her records and the law",
    body: "Findoe shows where every answer comes from.",
    actions: [
      { do: "click", on: { css: "button.fixed", text: "Ask Findoe" } },
      { do: "wait", for: { css: `${findoePanel} textarea` } },
      { do: "look", at: { css: findoePanel } },
      { do: "type", into: { css: `${findoePanel} textarea` }, text: QUESTION },
      { do: "click", on: { css: `${findoePanel} button`, text: "Send" } },
      { do: "wait", for: { text: "Used 1 record and 1 law" } },
    ],
    focus: { css: findoePanel },
    fit: "width",
    maxZoom: 2,
  },
  {
    id: "children",
    chapter: "after",
    scene: "child-home",
    title: "The children get a gentle note",
    body: "Nothing is asked of them.",
    focus: { text: "so sorry about Husband", closest: ".max-w-7xl" },
  },

  // --- Summary -------------------------------------------------------------
  {
    id: "close",
    chapter: "close",
    title: "Clarity for families. Context for advisors.",
    body: "The family stays with PNC because it was already there.",
  },
];
