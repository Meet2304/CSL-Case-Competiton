/**
 * Re-shoots every app capture the demo video uses, from the live prototype.
 *
 *   npm run capture            (or: node scripts/capture.ts)
 *   FINDOE_URL=http://localhost:3000 npm run capture
 *
 * Writes PNG stills (1920x1080 viewport at deviceScaleFactor 2, so 3840x2160)
 * and short MP4 clips to public/captures/, plus public/captures/manifest.json:
 * the on-screen box of every element a glow ring or the cursor points at (in
 * CSS pixels of the 1920x1080 viewport), clip event times, and the exact labels
 * the overlays quote (rulebook version, decision path). The video reads that
 * manifest, so re-running this after an app change keeps rings on their elements.
 *
 * Only browser-local demo state is touched: the advisor's "Record a death
 * notice" (the app's own demo control, stored in localStorage) so the wife's
 * after-loss view exists, and one "The details are correct" tick on her claim.
 */
import { chromium, type Browser, type BrowserContext, type Locator, type Page } from "playwright";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { ffmpeg, ROOT } from "./ffmpeg.ts";

const BASE = (process.env.FINDOE_URL ?? "https://findoe.vercel.app").replace(/\/$/, "");
const OUT = join(ROOT, "public", "captures");
const VIEWPORT = { width: 1920, height: 1080 };
const SCALE = 2;
const CLIP_FPS = 30;
// A regular desktop Chrome UA: the app picks the laptop view from the user agent.
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36";

type Box = { x: number; y: number; w: number; h: number };
type Shot = { file: string; boxes: Record<string, Box> };
type Clip = {
  file: string;
  duration: number;
  width: number;
  height: number;
  events: Record<string, number>;
};
type Manifest = {
  capturedAt: string;
  base: string;
  viewport: typeof VIEWPORT;
  scale: number;
  shots: Record<string, Shot>;
  clips: Record<string, Clip>;
  labels: Record<string, string>;
  decisionPath?: {
    account: string;
    steps: { question: string; answer: string }[];
    outcome: string;
  };
};

const manifest: Manifest = {
  capturedAt: new Date().toISOString(),
  base: BASE,
  viewport: VIEWPORT,
  scale: SCALE,
  shots: {},
  clips: {},
  labels: {},
};

const log = (msg: string) => console.log(`[capture] ${msg}`);

// ---------------------------------------------------------------------------
// Helpers

async function newContext(browser: Browser): Promise<BrowserContext> {
  return browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: SCALE,
    userAgent: USER_AGENT,
    locale: "en-US",
  });
}

async function settle(page: Page, ms = 700) {
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.evaluate(() => document.fonts.ready);
  // Park the pointer on empty page background so no hover state is captured.
  await page.mouse.move(2, 600);
  await page.waitForTimeout(ms);
}

async function boxOf(locator: Locator): Promise<Box> {
  await locator.first().waitFor({ state: "visible", timeout: 15_000 });
  const b = await locator.first().boundingBox();
  if (!b) throw new Error(`No box for ${locator}`);
  return { x: round(b.x), y: round(b.y), w: round(b.width), h: round(b.height) };
}

const round = (n: number) => Math.round(n * 10) / 10;

/** The closest `ancestor` of the smallest element whose text contains `text`. */
function near(page: Page, text: string, ancestor: string): Locator {
  return page
    .getByText(text, { exact: false })
    .first()
    .locator(`xpath=ancestor-or-self::${ancestor}[1]`);
}

/** The white card (`shadow-card`) holding `text`. */
function cardOf(page: Page, text: string): Locator {
  return page
    .getByText(text, { exact: true })
    .first()
    .locator(
      `xpath=ancestor::*[contains(concat(' ', normalize-space(@class), ' '), ' shadow-card ')][1]`,
    );
}

/** The card under a heading whose text starts with `start` (headings may carry a count). */
function cardOfHeading(page: Page, start: RegExp): Locator {
  return page
    .getByRole("heading", { name: start })
    .first()
    .locator(
      `xpath=ancestor::*[contains(concat(' ', normalize-space(@class), ' '), ' shadow-card ')][1]`,
    );
}

/** Scrolls `el` into view inside its own scroll container only, leaving the page where it is. */
async function scrollWithin(locator: Locator, align: "center" | "end") {
  await locator.first().evaluate((el, how) => {
    let box = el.parentElement;
    while (
      box &&
      !(
        /(auto|scroll)/.test(getComputedStyle(box).overflowY) && box.scrollHeight > box.clientHeight
      )
    )
      box = box.parentElement;
    if (!box) return;
    const r = el.getBoundingClientRect();
    const c = box.getBoundingClientRect();
    const offset =
      how === "center" ? r.top - c.top - (c.height - r.height) / 2 : r.bottom - c.bottom + 12;
    box.scrollTop += offset;
    window.scrollTo(0, 0);
  }, align);
}

async function still(page: Page, name: string, targets: Record<string, Locator>) {
  await settle(page);
  const boxes: Record<string, Box> = {};
  for (const [key, loc] of Object.entries(targets)) boxes[key] = await boxOf(loc);
  const file = `${name}.png`;
  await page.screenshot({ path: join(OUT, file) });
  manifest.shots[name] = { file, boxes };
  log(`still ${file} (${Object.keys(boxes).length} boxes)`);
}

/**
 * Records the page while `actions` run, using Chrome's screencast at device
 * resolution, and encodes a constant-frame-rate MP4. `mark(label)` stores the
 * time of an interaction (seconds from the clip's first frame) for the cursor.
 */
async function clip(
  page: Page,
  name: string,
  actions: (mark: (label: string) => void) => Promise<void>,
) {
  await settle(page);
  const cdp = await page.context().newCDPSession(page);
  const frames: { data: Buffer; t: number }[] = [];
  cdp.on("Page.screencastFrame", (f) => {
    frames.push({
      data: Buffer.from(f.data, "base64"),
      t: f.metadata.timestamp ?? Date.now() / 1000,
    });
    cdp.send("Page.screencastFrameAck", { sessionId: f.sessionId }).catch(() => {});
  });
  await cdp.send("Page.startScreencast", {
    format: "jpeg",
    quality: 95,
    maxWidth: VIEWPORT.width * SCALE,
    maxHeight: VIEWPORT.height * SCALE,
    everyNthFrame: 1,
  });
  const started = Date.now() / 1000;
  // Nudge a repaint so the first frame arrives straight away.
  await page.mouse.move(3, 600);
  await page.waitForTimeout(500);
  const marks: Record<string, number> = {};
  await actions((label) => (marks[label] = Date.now() / 1000));
  await page.waitForTimeout(400);
  const ended = Date.now() / 1000;
  await cdp.send("Page.stopScreencast");
  await cdp.detach();
  if (frames.length === 0) throw new Error(`No screencast frames for ${name}`);

  const t0 = Math.min(frames[0].t, started);
  const duration = ended - t0;
  const dir = mkdtempSync(join(tmpdir(), `findoe-${name}-`));
  frames.forEach((f, i) => writeFileSync(join(dir, `f${String(i).padStart(5, "0")}.jpg`), f.data));
  // Constant frame rate: each output frame shows the latest screencast frame at that time.
  const lines: string[] = [];
  const total = Math.ceil(duration * CLIP_FPS);
  let j = 0;
  for (let i = 0; i < total; i++) {
    const t = t0 + i / CLIP_FPS;
    while (j + 1 < frames.length && frames[j + 1].t <= t) j++;
    lines.push(
      `file 'f${String(j).padStart(5, "0")}.jpg'`,
      `duration ${(1 / CLIP_FPS).toFixed(6)}`,
    );
  }
  lines.push(`file 'f${String(j).padStart(5, "0")}.jpg'`);
  writeFileSync(join(dir, "list.txt"), lines.join("\n"));
  const file = `${name}.mp4`;
  ffmpeg([
    "-loglevel",
    "error",
    "-y",
    "-f",
    "concat",
    "-safe",
    "0",
    "-i",
    join(dir, "list.txt"),
    "-vf",
    `scale=${VIEWPORT.width * SCALE}:${VIEWPORT.height * SCALE}:flags=lanczos,format=yuv420p`,
    "-r",
    String(CLIP_FPS),
    "-c:v",
    "libx264",
    "-preset",
    "slow",
    "-crf",
    "16",
    "-movflags",
    "+faststart",
    join(OUT, file),
  ]);
  rmSync(dir, { recursive: true, force: true });
  const events = Object.fromEntries(
    Object.entries(marks).map(([k, v]) => [k, round((v - t0) * 1000) / 1000]),
  );
  manifest.clips[name] = {
    file,
    duration: round(duration * 1000) / 1000,
    width: VIEWPORT.width,
    height: VIEWPORT.height,
    events,
  };
  log(`clip ${file} (${frames.length} frames, ${duration.toFixed(2)}s)`);
}

async function signOn(page: Page, user: string, shotPrefix?: string) {
  await page.goto(`${BASE}/`);
  const chip = page.getByRole("button", { name: new RegExp(`^${user} ·`) });
  const button = page.getByRole("button", { name: "Sign On", exact: true });
  if (shotPrefix) await still(page, `${shotPrefix}-signon`, { chip, button });
  await chip.click();
  if (shotPrefix) await still(page, `${shotPrefix}-signon-filled`, { chip, button });
  await button.click();
  await page.waitForURL((u) => u.pathname !== "/", { timeout: 30_000 });
  await settle(page);
}

async function signOff(page: Page) {
  await page.getByRole("button", { name: /^Sign off/ }).click();
  await page.waitForURL(`${BASE}/`, { timeout: 30_000 });
}

// ---------------------------------------------------------------------------
// Scenes

/** Scene 1 + 2: sign on as husband; home, notifications, family roles. */
async function husband(page: Page) {
  await signOn(page, "husband", "s1");
  await still(page, "s2-home", {
    glance: cardOf(page, "Your money at a glance"),
    lifePolicy: page.getByText(/term life policy held outside PNC/).first(),
    notifications: cardOf(page, "Notifications"),
    notifWill: near(page, "Write your will", "li"),
    notifBeneficiary: near(page, "Add a beneficiary to Savings x0002", "li"),
    willLink: page.getByText("Start your will", { exact: true }).first(),
    beneficiaryLink: near(page, "Add a beneficiary to Savings x0002", "li").getByText(
      "Add beneficiary",
      { exact: true },
    ),
    navFamily: page.getByRole("link", { name: "Family", exact: true }),
    families: cardOf(page, "Your families"),
  });

  await page.goto(`${BASE}/family#fam-sample`);
  const manage = page.getByRole("button", { name: "Manage family" });
  // The family dashboard: one family's shared accounts, stats and people.
  await still(page, "s2-family", {
    manage,
    header: page.getByRole("heading", { name: "Sample Family" }),
    stats: page
      .getByText("Accounts shared", { exact: true })
      .first()
      .locator(
        "xpath=ancestor::*[contains(concat(' ', normalize-space(@class), ' '), ' shadow-card ')][1]",
      ),
    shared: cardOf(page, "Shared assets"),
    people: cardOf(page, "People"),
    jointRow: near(page, "Owned by Husband & Wife", "li"),
  });
  await manage.click();
  const rolesTab = page.getByRole("tab", { name: "Roles & access" });
  await still(page, "s2-members", { rolesTab, dialog: page.getByRole("dialog") });
  await rolesTab.click();
  await page.getByText("Older child", { exact: true }).first().waitFor();
  await still(page, "s2-roles", {
    rolesTab,
    dialog: page.getByRole("dialog"),
    roleAdmin: near(page, "Full access to every shared account", "li"),
    roleOlder: near(page, "Sees the household checking account", "li"),
    roleYounger: near(page, "Nothing shared yet.", "li"),
  });
  await page.keyboard.press("Escape");
  await signOff(page);
}

/** Scene 4: the advisor, before anything is recorded in this browser. */
async function advisor(page: Page) {
  await signOn(page, "advisor", "s4");
  await still(page, "s4-home", {
    notifications: cardOfHeading(page, /^Notifications/),
    notifLoss: near(page, "Morgan Placeholder · spouse passed away", "li"),
    customers: cardOfHeading(page, /^Your Customers/),
  });

  await page.goto(`${BASE}/advisor/clients/c-placeholder`);
  const panel = page.locator('[aria-label="Findoe"]:visible').first();
  await page
    .getByText(/grounded in the rulebook|answers from the rulebook only/)
    .first()
    .waitFor({ timeout: 30_000 });
  const howIDecided = page.getByText(/^How I decided · \d+ accounts$/).first();
  const question529 = page.locator('section[aria-labelledby="findoe-question"]').first();
  await still(page, "s4-client", {
    where: page
      .getByText("Where things stand", { exact: true })
      .first()
      .locator("xpath=ancestor::section[1]"),
    headline: page.getByText(/died \d+ days? ago|died (today|yesterday)/).first(),
    figures: page
      .getByText("Passes outside probate", { exact: true })
      .first()
      .locator("xpath=ancestor::dl[1]"),
    outsideProbate: page
      .getByText("Passes outside probate", { exact: true })
      .first()
      .locator("xpath=.."),
    probate: page.getByText("Goes through probate", { exact: true }).first().locator("xpath=.."),
    doNext: page.getByText("Do next", { exact: true }).first(),
    step1: near(page, "to offer condolences", "li"),
    panel,
    grounded: page.getByText(/grounded in the rulebook/).first(),
    brief: page.getByText(/^I walked \d+ accounts/).first(),
    howIDecided,
    question529,
    version: page.getByText(/v\d{4}\.\d+-[a-z0-9-]+$/).last(),
  });

  const text = await page.locator("body").innerText();
  manifest.labels.rulebookVersion = text.match(/v\d{4}\.\d+-[a-z0-9-]+/)?.[0] ?? "";
  manifest.labels.grounded = (
    await page
      .getByText(/grounded in the rulebook/)
      .first()
      .innerText()
  ).trim();
  manifest.labels.howIDecided = (await howIDecided.innerText()).trim();
  manifest.labels.question529 = (
    await page
      .getByText(/^Who should own 529/)
      .first()
      .innerText()
  ).trim();
  manifest.labels.step1 = (
    await page
      .getByText(/to offer condolences$/)
      .first()
      .innerText()
  ).trim();

  await howIDecided.click();
  const iraStep = page.getByText(/^Traditional IRA x0015: /).first();
  await iraStep.waitFor();
  manifest.labels.iraPath = (await iraStep.innerText()).trim();
  await scrollWithin(iraStep, "center");
  await still(page, "s4-decided", {
    panel,
    iraStep: iraStep.locator("xpath=ancestor::li[1]"),
    grounded: page.getByText(/grounded in the rulebook/).first(),
  });
  await scrollWithin(question529, "end");
  await still(page, "s4-question", { panel, question529 });

  // The full decision path (questions and answers) behind the IRA, from Details.
  await page.getByText("What happens to each account", { exact: true }).first().click();
  await page
    .getByRole("button", { name: /^Traditional IRA x0015/ })
    .first()
    .click();
  const path = page.locator('section[aria-label="Decision path"]').first();
  await path.waitFor();
  manifest.decisionPath = await path.evaluate((section) => {
    const items = [...section.querySelectorAll("ol > li")];
    const steps = items
      .map((li) => {
        const p = li.querySelector("p");
        const answer = p?.querySelector("span.font-semibold");
        if (!p || !answer) return null;
        const question = (p.firstChild?.textContent ?? "").trim();
        const a = (answer.textContent ?? "").replace("Answer:", "").trim();
        return { question, answer: a };
      })
      .filter((s): s is { question: string; answer: string } => s !== null && s.question !== "");
    const outcome =
      (section.textContent ?? "").match(/Outcome: (.+?)Typical time/)?.[1]?.trim() ?? "";
    return { account: "Traditional IRA x0015", steps, outcome };
  });
  log(
    `decision path: ${manifest.decisionPath?.steps.length} steps → ${manifest.decisionPath?.outcome}`,
  );
  await signOff(page);
}

/** Scene 3: record Husband's death (advisor demo control), then the wife's after-loss view. */
async function widow(page: Page) {
  await signOn(page, "advisor");
  await page.getByRole("button", { name: "More actions" }).click();
  await page.getByText("Record a death notice").first().click();
  await page.getByRole("button", { name: "Record and notify" }).click();
  await page.waitForTimeout(600);
  await signOff(page);

  await signOn(page, "wife", "s3");
  await page.goto(`${BASE}/assets#unclaimed`);
  await page.getByText("accounts that can pass to you").first().waitFor();
  const launcher = page.locator("button.fixed", { hasText: "Ask Findoe" });
  const iraRow = near(page, "Husband named you as the beneficiary.", "li");
  await still(page, "s3-unclaimed", {
    lossStrip: page
      .getByText(/so sorry for the loss of/)
      .first()
      .locator("xpath=ancestor::*[2]"),
    intro: cardOf(page, "Husband's accounts that can pass to you"),
    list: page.locator('ul[aria-label="Accounts you can claim"]'),
    rowJoint: near(page, "Owned together, so it's already yours.", "li"),
    rowIra: iraRow,
    iraStart: page.getByRole("button", { name: /Start claim for 401\(k\)/ }),
    launcher,
  });

  const question = "How do I claim the 401(k) Rollover IRA?";
  await clip(page, "s3-agent", async (mark) => {
    mark("launcherClick");
    await launcher.click();
    await page.waitForTimeout(700);
    const input = page.getByRole("textbox", { name: "Ask Findoe" });
    mark("inputClick");
    await input.click();
    await page.waitForTimeout(250);
    mark("typingStart");
    await page.keyboard.type(question, { delay: 38 });
    mark("typingEnd");
    await page.waitForTimeout(200);
    mark("send");
    await page.keyboard.press("Enter");
    await page
      .getByText(/^Used \d+ records? and \d+ laws?/)
      .first()
      .waitFor({ timeout: 30_000 });
    mark("answered");
    await page.waitForTimeout(1500);
  });
  const panel = page.locator('aside[aria-label="Findoe"]:visible').first();
  await still(page, "s3-answer", {
    panel,
    input: page.getByRole("textbox", { name: "Ask Findoe" }),
    question: panel.getByText(question).first(),
    work: page
      .getByText(/^Used \d+ records? and \d+ laws?/)
      .first()
      .locator("xpath=ancestor::div[2]"),
    asks: page.getByText("What the claim asks for:", { exact: true }).first(),
    claimList: page
      .getByText("What the claim asks for:", { exact: true })
      .first()
      .locator("xpath=following::ul[1]"),
    next: page.getByText(/^Once you send it/).first(),
  });
  manifest.labels.answerWork = (
    await page
      .getByText(/^Used \d+ records? and \d+ laws?/)
      .first()
      .innerText()
  ).trim();

  await page.keyboard.press("Escape");
  await page.waitForTimeout(400);
  await page.getByRole("button", { name: /Start claim for 401\(k\)/ }).click();
  const progress = page.getByText(/^\d+ of \d+ done$/).first();
  const confirm = page.getByText("The details are correct", { exact: true }).first();
  await still(page, "s3-claim", {
    title: page.getByRole("heading", { name: "401(k) Rollover IRA" }),
    progress: progress.locator("xpath=.."),
    progressLabel: progress,
    step1: near(page, "Certified death certificate", "li"),
    step2: near(page, "Beneficiary claim form", "li"),
    confirm,
  });
  await confirm.click();
  await page.waitForTimeout(400);
  await still(page, "s3-claim-done", {
    progress: progress.locator("xpath=.."),
    progressLabel: progress,
    confirm,
  });
  manifest.labels.claimProgress = (await progress.innerText()).trim();
}

// ---------------------------------------------------------------------------

async function main() {
  mkdirSync(OUT, { recursive: true });
  log(`capturing ${BASE} → ${OUT}`);
  const browser = await chromium.launch();
  try {
    // Fresh browser state: husband, then the advisor's seeded cases.
    const a = await newContext(browser);
    const pa = await a.newPage();
    await husband(pa);
    await advisor(pa);
    await a.close();
    // A separate browser state for the loss, so the advisor shots above stay clean.
    const b = await newContext(browser);
    await widow(await b.newPage());
    await b.close();
  } finally {
    await browser.close();
  }
  writeFileSync(join(OUT, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
  log("manifest.json written");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
